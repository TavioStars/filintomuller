import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getVapidPublicKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("push", {
    body: { action: "get-key" },
  });
  if (error) throw error;
  return data.publicKey;
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push not supported");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
    }

    const publicKey = await getVapidPublicKey();

    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      try { await existingSub.unsubscribe(); } catch (e) { console.warn("Failed to unsubscribe old push:", e); }
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      console.error("Invalid subscription object:", subJson);
      return false;
    }

    await supabase.from("push_subscriptions" as any).delete().eq("user_id", userId);

    const { error } = await supabase.from("push_subscriptions" as any).insert({
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    });

    if (error) { console.error("Error storing push subscription:", error); return false; }
    console.log("Push subscription stored successfully");
    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export async function refreshPushSubscription(userId: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const subJson = existing.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await supabase.from("push_subscriptions" as any).delete().eq("user_id", userId);
        await supabase.from("push_subscriptions" as any).insert({
          user_id: userId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        });
        console.log("Push subscription refreshed");
      }
    } else {
      console.log("No active push subscription, re-subscribing...");
      await subscribeToPush(userId);
    }
  } catch (err) {
    console.error("Push refresh failed:", err);
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from("push_subscriptions" as any).delete().eq("endpoint", endpoint);
    }
  } catch (err) {
    console.error("Push unsubscribe failed:", err);
  }
}

export async function sendPushToAll(title: string, body: string, data?: any): Promise<void> {
  try {
    const { data: result, error } = await supabase.functions.invoke("push", {
      body: { action: "send", title, body, data },
    });
    if (error) console.error("Push send error:", error);
    else console.log("Push sent:", result);
  } catch (err) {
    console.error("Error sending push notifications:", err);
  }
}
