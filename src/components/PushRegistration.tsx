"use client";

import { useEffect } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushRegistration() {
  useEffect(() => {
    if (!VAPID_PUBLIC || typeof window === "undefined") return;

    async function register() {
      if (!VAPID_PUBLIC) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
          });
        }

        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: sub.endpoint,
              keys: {
                p256dh: btoa(
                  String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))
                ),
                auth: btoa(
                  String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))
                ),
              },
            }),
          });
        }
      } catch {
        // Permission denied or not supported
      }
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => register())
        .catch(() => {});
    }
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
