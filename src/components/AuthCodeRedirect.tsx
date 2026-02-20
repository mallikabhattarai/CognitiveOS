"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Client-side fallback: when Supabase redirects to /?code=xxx (e.g. from magic link),
 * redirect to /auth/callback so the code can be exchanged. Handles edge/CDN caching
 * cases where the server-side redirect on the root page may not run.
 */
export function AuthCodeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = searchParams.get("next") ?? "/home";
      const params = new URLSearchParams({ code, next });
      router.replace(`/auth/callback?${params.toString()}`);
    }
  }, [searchParams, router]);

  return null;
}
