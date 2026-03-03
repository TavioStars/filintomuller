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

    const registration = await navigator.serviceWorker.ready;
    const publicKey = await getVapidPublicKey();

    const reg = registration as any;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const subJson = subscription.toJSON();

    // Store subscription in DB
    const { error } = await supabase.from("push_subscriptions" as any).upsert(
      {
        user_id: userId,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Error storing push subscription:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as any;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase
        .from("push_subscriptions" as any)
        .delete()
        .eq("endpoint", endpoint);
    }
  } catch (err) {
    console.error("Push unsubscribe failed:", err);
  }
}

export async function sendPushToAll(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    await supabase.functions.invoke("push", {
      body: { action: "send", title, body, data },
    });
  } catch (err) {
    console.error("Error sending push notifications:", err);
  }
}
