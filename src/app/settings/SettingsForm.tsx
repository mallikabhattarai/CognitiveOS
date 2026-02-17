"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetch";

function SleepImportForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetchWithAuth("/api/sleep/import", {
      method: "POST",
      body: formData,
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setResult({ imported: 0, errors: [data.error ?? "Import failed"] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="block w-full text-sm text-text-muted"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import"}
      </button>
      {result && (
        <p className="text-sm text-text-muted">
          Imported {result.imported} record(s).
          {result.errors?.length ? ` ${result.errors.length} error(s).` : ""}
        </p>
      )}
    </form>
  );
}

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
  { value: "early", label: "Early bird (peak morning)" },
  { value: "intermediate", label: "Intermediate" },
  { value: "late", label: "Night owl (peak afternoon)" },
] as const;

type SettingsFormProps = {
  email: string;
  timezone: string;
  chronotype: string;
};

export function SettingsForm({ email, timezone, chronotype }: SettingsFormProps) {
  const [tz, setTz] = useState(timezone);
  const [chrono, setChrono] = useState(chronotype);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const res = await fetchWithAuth("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: tz, chronotype: chrono }),
    });

    setLoading(false);
    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-sm font-medium text-text-primary">
          Email
        </p>
        <p className="mt-1 text-text-muted">{email}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {error && (
          <div className="rounded-xl bg-risk-muted p-3 text-sm text-risk">
            {error}
          </div>
        )}
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-text-primary"
        >
          Timezone
        </label>
        <select
          id="timezone"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {COMMON_TIMEZONES.map((tzOption) => (
            <option key={tzOption} value={tzOption}>
              {tzOption}
            </option>
          ))}
        </select>
        <label
          htmlFor="chronotype"
          className="mt-4 block text-sm font-medium text-text-primary"
        >
          Chronotype
        </label>
        <p className="mt-0.5 text-xs text-text-muted">
          Affects your Peak Performance Windows
        </p>
        <select
          id="chronotype"
          value={chrono}
          onChange={(e) => setChrono(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {CHRONOTYPES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="ml-2 text-sm text-success">
            Saved
          </span>
        )}
      </form>

      <div className="border-t border-[var(--border-subtle)] pt-6">
        <p className="text-sm font-medium text-text-primary">
          Import sleep data
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Upload a CSV with columns: date, duration_minutes (or bedtime + wake_time), quality_rating (optional)
        </p>
        <SleepImportForm />
      </div>

      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="text-sm text-text-muted transition-colors duration-200 hover:text-accent"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
