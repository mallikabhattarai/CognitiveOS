"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetch";

type OnboardingFlowProps = {
  initialTimezone: string;
  initialChronotype: string;
  userId: string;
};

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const CHRONOTYPES = [
  { value: "early", label: "Early bird" },
  { value: "intermediate", label: "Intermediate" },
  { value: "late", label: "Night owl" },
];

export function OnboardingFlow({
  initialTimezone,
  initialChronotype,
  userId,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<"timezone" | "sleep">("timezone");
  const [timezone, setTimezone] = useState(initialTimezone);
  const [chronotype, setChronotype] = useState(initialChronotype);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const detected = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && (initialTimezone === "UTC" || !initialTimezone)) {
        setTimezone(detected);
      }
    } catch {
      // ignore
    }
  }, [initialTimezone]);

  const handleTimezoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetchWithAuth("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, chronotype }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      setLoading(false);
      return;
    }

    setStep("sleep");
    setLoading(false);
  };

  if (step === "timezone") {
    return (
      <main className="flex min-h-screen flex-col justify-center p-6">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-text-primary">
            Set your preferences
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Used for sleep and peak performance calculations.
          </p>

          <form
            onSubmit={handleTimezoneSubmit}
            className="mt-8 space-y-4"
          >
            {error && (
              <div className="rounded-xl bg-risk-muted p-3 text-sm text-risk">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-text-primary"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="chronotype"
                className="block text-sm font-medium text-text-primary"
              >
                Chronotype
              </label>
              <select
                id="chronotype"
                value={chronotype}
                onChange={(e) => setChronotype(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CHRONOTYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text-primary">
          Log your first night
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Track one night of sleep to unlock your first prediction.
        </p>

        <Link
          href="/sleep"
          className="mt-8 inline-block w-full rounded-xl bg-accent px-4 py-2.5 text-center font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90"
        >
          Log sleep
        </Link>

        <button
          type="button"
          onClick={() => router.push("/home")}
          className="mt-3 w-full text-center text-sm text-text-muted transition-colors hover:text-accent"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
