"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type SignupFormProps = {
  supabaseUrl: string;
  supabaseKey: string;
};

export function SignupForm({ supabaseUrl, supabaseKey }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (supabaseUrl.includes("your-project") || supabaseUrl === "") {
      setError(
        "Supabase is not configured. Add your project URL and anon key to .env.local (see .env.example). Get them from supabase.com → Project Settings → API."
      );
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-medium tracking-tight text-text-primary">
          Create account
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
          {message && (
            <div className="rounded-xl bg-success-muted p-3 text-sm text-success">
              {message}
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
              minLength={6}
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent transition-colors hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
