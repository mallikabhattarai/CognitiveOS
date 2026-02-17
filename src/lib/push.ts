import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC && VAPID_PRIVATE);
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!isPushConfigured()) return;

  webpush.setVapidDetails(
    "mailto:support@cognitiveos.app",
    VAPID_PUBLIC!,
    VAPID_PRIVATE!
  );

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const sendPromises = subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
        { TTL: 86400 }
      );
    } catch (err) {
      if (err && typeof err === "object" && "statusCode" in err) {
        if ((err as { statusCode: number }).statusCode === 410 || (err as { statusCode: number }).statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("endpoint", sub.endpoint);
        }
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
