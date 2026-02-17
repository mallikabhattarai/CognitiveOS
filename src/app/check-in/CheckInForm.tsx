"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetch";

export function CheckInForm({ date }: { date: string }) {
  const [sleepQuality, setSleepQuality] = useState(5);
  const [mentalClarity, setMentalClarity] = useState(5);
  const [energyRating, setEnergyRating] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetchWithAuth("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        sleep_quality: sleepQuality,
        mental_clarity: mentalClarity,
        energy_rating: showOptional ? (energyRating ?? 3) : undefined,
        stress_level: showOptional ? (stressLevel ?? 5) : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-xl bg-risk-muted p-3 text-sm text-risk">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary">
          How did you sleep? (1–10)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="range"
            min={1}
            max={10}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
            className="flex-1 rounded-lg"
          />
          <span className="w-8 text-sm font-medium text-text-muted tabular-nums">
            {sleepQuality}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">
          Mental clarity right now? (1–10)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="range"
            min={1}
            max={10}
            value={mentalClarity}
            onChange={(e) => setMentalClarity(parseInt(e.target.value, 10))}
            className="flex-1 rounded-lg"
          />
          <span className="w-8 text-sm font-medium text-text-muted tabular-nums">
            {mentalClarity}
          </span>
        </div>
      </div>

      {showOptional ? (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Energy level (optional, 1–5)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="range"
                min={1}
                max={5}
                value={energyRating ?? 3}
                onChange={(e) =>
                  setEnergyRating(parseInt(e.target.value, 10))
                }
                className="flex-1 rounded-lg"
              />
              <span className="w-8 text-sm font-medium text-text-muted tabular-nums">
                {energyRating ?? 3}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Workload stress (optional, 1–10)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={stressLevel ?? 5}
                onChange={(e) =>
                  setStressLevel(parseInt(e.target.value, 10))
                }
                className="flex-1 rounded-lg"
              />
              <span className="w-8 text-sm font-medium text-text-muted tabular-nums">
                {stressLevel ?? 5}
              </span>
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowOptional(true)}
          className="text-sm text-text-muted transition-colors duration-200 hover:text-accent"
        >
          + Add energy & stress (optional)
        </button>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
        <Link
          href="/home"
          className="rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center font-medium text-text-primary transition-colors duration-200 hover:bg-accent-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
