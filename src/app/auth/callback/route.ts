import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  return url.origin;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";
  const origin = getOrigin(request);
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/47e11e42-6a9c-48e8-ad75-14af6ae07abb", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "auth/callback/route.ts:GET",
      message: "auth callback hit",
      data: {
        hasCode: !!code,
        next,
        origin,
        url: request.url,
        hypothesisId: "h4",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
