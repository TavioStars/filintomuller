import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      const keys = webpush.generateVAPIDKeys();
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

    webpush.setVapidDetails(
      "mailto:admin@filintomuller.app",
      vapidPublicKey,
      vapidPrivateKey
    );

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
          webpush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({ title, body: notifBody, data })
            )
            .catch(async (err: any) => {
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
