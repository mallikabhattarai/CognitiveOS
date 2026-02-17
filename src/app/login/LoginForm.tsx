"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFormProps = {
  supabaseUrl: string;
  supabaseKey: string;
};

function LoginFormInner({ supabaseUrl, supabaseKey }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (supabaseUrl.includes("your-project") || supabaseUrl === "") {
      setError(
        "Supabase is not configured. Add your project URL and anon key to .env.local (see .env.example). Get them from supabase.com → Project Settings → API."
      );
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    if (next && next !== "/home" && next !== "/onboarding") {
      router.push(next);
    } else {
      const meRes = await fetch("/api/me");
      if (meRes.ok) {
        const { needsOnboarding } = await meRes.json();
        router.push(needsOnboarding ? "/onboarding" : "/home");
      } else {
        router.push("/home");
      }
    }
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-medium tracking-tight text-text-primary">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          CognitiveOS — protect your cognitive performance
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl bg-risk-muted p-3 text-sm text-risk">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent transition-colors hover:opacity-80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export function LoginForm({ supabaseUrl, supabaseKey }: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-accent-muted" />
        </div>
      }
    >
      <LoginFormInner supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />
    </Suspense>
  );
}
