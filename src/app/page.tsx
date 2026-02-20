import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params?.code) {
    const next = params.next ?? "/home";
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/47e11e42-6a9c-48e8-ad75-14af6ae07abb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "page.tsx:root",
        message: "root received code, redirecting to callback",
        data: { hasCode: true, next, hypothesisId: "h4" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    redirect(`/auth/callback?code=${params.code}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-bg-base to-accent-muted/30 p-6">
      <h1 className="text-3xl font-medium tracking-tight text-text-primary">
        CognitiveOS
      </h1>
      <p className="mt-3 max-w-sm text-center text-base leading-relaxed text-text-muted">
        Protect and optimize your cognitive performance through sleep
        intelligence.
      </p>
      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-accent px-4 py-3 text-center font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-3 text-center font-medium text-text-primary transition-colors duration-200 hover:bg-accent-muted"
        >
          Create account
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-text-muted">
        Research-backed sleep intelligence
      </p>
    </main>
  );
}
