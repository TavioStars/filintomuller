import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Minimal VAPID + web-push implementation using Web Crypto API
async function generateVAPIDKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  
  const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const privateKey = privateKeyJwk.d!;
  
  return { publicKey, privateKey };
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(audience: string, subject: string, privateKeyB64: string, publicKeyB64: string) {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import private key
  const publicKeyRaw = base64UrlToUint8Array(publicKeyB64);
  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);
  
  // Build JWK for import
  const x = uint8ArrayToBase64Url(publicKeyRaw.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyRaw.slice(33, 65));
  
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: privateKeyB64,
  };
  
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert DER signature to raw r||s format if needed
  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigArray.length === 64) {
    rawSig = sigArray;
  } else {
    // DER format
    const r = sigArray.slice(4, 4 + sigArray[3]);
    const sOffset = 4 + sigArray[3] + 2;
    const s = sigArray.slice(sOffset, sOffset + sigArray[sOffset - 1]);
    rawSig = new Uint8Array(64);
    rawSig.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
    rawSig.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  }
  
  const encodedSignature = uint8ArrayToBase64Url(rawSig);
  return `${unsignedToken}.${encodedSignature}`;
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const jwt = await createJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey);
  
  // Generate local ECDH key pair for encryption
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  
  // Import subscriber's public key
  const subscriberPublicKeyRaw = base64UrlToUint8Array(subscription.keys.p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberPublicKey },
      localKeyPair.privateKey,
      256
    )
  );
  
  const authSecret = base64UrlToUint8Array(subscription.keys.auth);
  
  // HKDF helper
  async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.length > 0 ? salt : new Uint8Array(32)));
    const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const infoWithCounter = new Uint8Array([...info, 1]);
    const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
    return okm.slice(0, length);
  }
  
  // RFC 8291 encryption
  const encoder = new TextEncoder();
  
  // IKM for auth
  const authInfo = new Uint8Array([
    ...encoder.encode("WebPush: info\0"),
    ...subscriberPublicKeyRaw,
    ...localPublicKeyRaw,
  ]);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive CEK and nonce
  const cekInfo = new Uint8Array([...encoder.encode("Content-Encoding: aes128gcm\0")]);
  const nonceInfo = new Uint8Array([...encoder.encode("Content-Encoding: nonce\0")]);
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  // Encrypt payload
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array([...payloadBytes, 2]); // delimiter
  
  const cryptoKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, paddedPayload)
  );
  
  // Build body: header (salt + rs + keyid) + encrypted
  const rs = 4096;
  const header = new Uint8Array([
    ...salt,
    (rs >> 24) & 0xff, (rs >> 16) & 0xff, (rs >> 8) & 0xff, rs & 0xff,
    localPublicKeyRaw.length,
    ...localPublicKeyRaw,
  ]);
  
  const body = new Uint8Array([...header, ...encrypted]);
  
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body,
  });
  
  if (!response.ok) {
    const text = await response.text();
    const error: any = new Error(`Push failed: ${response.status} ${text}`);
    error.statusCode = response.status;
    throw error;
  }
  
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Ensure VAPID keys exist
    const { data: existingKeys } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["vapid_public_key", "vapid_private_key"]);

    let vapidPublicKey: string;
    let vapidPrivateKey: string;

    if (!existingKeys || existingKeys.length < 2) {
      const keys = await generateVAPIDKeys();
      vapidPublicKey = keys.publicKey;
      vapidPrivateKey = keys.privateKey;

      await supabase.from("app_settings").upsert([
        { key: "vapid_public_key", value: vapidPublicKey },
        { key: "vapid_private_key", value: vapidPrivateKey },
      ]);
    } else {
      vapidPublicKey = existingKeys.find((k: any) => k.key === "vapid_public_key")!.value;
      vapidPrivateKey = existingKeys.find((k: any) => k.key === "vapid_private_key")!.value;
    }

    const body = await req.json();
    const { action } = body;

    // Return VAPID public key
    if (action === "get-key") {
      return new Response(JSON.stringify({ publicKey: vapidPublicKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send push to all subscribers
    if (action === "send") {
      const { title, body: notifBody, data } = body;

      const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*");

      if (error) throw error;

      const results = await Promise.allSettled(
        (subscriptions || []).map((sub: any) =>
          sendWebPush(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body: notifBody, data }),
            vapidPublicKey,
            vapidPrivateKey,
            "mailto:admin@filintomuller.app"
          ).catch(async (err: any) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
            throw err;
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return new Response(JSON.stringify({ sent, failed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Push function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
