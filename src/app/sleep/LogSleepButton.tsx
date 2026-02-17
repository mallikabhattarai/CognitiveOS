"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetch";

export function LogSleepButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 ${className ?? ""}`}
      >
        Log sleep
      </button>
    );
  }

  return (
    <LogSleepForm
      onClose={() => setOpen(false)}
      onSuccess={() => {
        setOpen(false);
        router.refresh();
      }}
      className={className}
    />
  );
}

function LogSleepForm({
  onClose,
  onSuccess,
  className,
}: {
  onClose: () => void;
  onSuccess: () => void;
  className?: string;
}) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [bedtime, setBedtime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("06:00");
  const [quality, setQuality] = useState<number | null>(null);
  const [caffeineAfter2pm, setCaffeineAfter2pm] = useState<boolean | null>(null);
  const [alcoholTonight, setAlcoholTonight] = useState<boolean | null>(null);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState<number | null>(null);
  const [exerciseToday, setExerciseToday] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const bedtimeDate = new Date(`${date}T${bedtime}`);
    const wakeDate = new Date(`${date}T${wakeTime}`);
    if (wakeDate <= bedtimeDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }

    const durationMinutes = Math.round((wakeDate.getTime() - bedtimeDate.getTime()) / 60000);
    if (durationMinutes < 120 || durationMinutes > 840) {
      setError("Sleep duration must be between 2 and 14 hours");
      setLoading(false);
      return;
    }

    const res = await fetchWithAuth("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        bedtime: bedtimeDate.toISOString(),
        wake_time: wakeDate.toISOString(),
        quality_rating: quality ?? undefined,
        caffeine_after_2pm: caffeineAfter2pm ?? undefined,
        alcohol_tonight: alcoholTonight ?? undefined,
        screen_time_minutes: screenTimeMinutes ?? undefined,
        exercise_today: exerciseToday ?? undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)] ${className ?? ""}`}
    >
      {error && (
        <div className="mb-3 rounded-xl bg-risk-muted p-2 text-sm text-risk">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-primary">
            Date (night of sleep)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Bedtime
            </label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Wake time
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">
            Quality (optional, 1–5)
          </label>
          <div className="mt-1 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuality(quality === n ? null : n)}
                className={`h-10 w-10 rounded-xl border text-sm font-medium transition-colors duration-200 ${
                  quality === n
                    ? "border-accent bg-accent text-white"
                    : "border-[var(--border-subtle)] bg-bg-base text-text-muted hover:bg-accent-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs font-medium text-text-muted">
            Optional context (improves insights)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setCaffeineAfter2pm(
                  caffeineAfter2pm === true ? null : true
                )
              }
              className={`rounded-xl border px-2 py-1 text-xs transition-colors duration-200 ${
                caffeineAfter2pm === true
                  ? "border-caution bg-caution-muted text-caution"
                  : "border-[var(--border-subtle)] text-text-muted hover:bg-accent-muted"
              }`}
            >
              Caffeine after 2pm
            </button>
            <button
              type="button"
              onClick={() =>
                setAlcoholTonight(alcoholTonight === true ? null : true)
              }
              className={`rounded-xl border px-2 py-1 text-xs transition-colors duration-200 ${
                alcoholTonight === true
                  ? "border-caution bg-caution-muted text-caution"
                  : "border-[var(--border-subtle)] text-text-muted hover:bg-accent-muted"
              }`}
            >
              Alcohol
            </button>
            <button
              type="button"
              onClick={() =>
                setExerciseToday(exerciseToday === true ? null : true)
              }
              className={`rounded-xl border px-2 py-1 text-xs transition-colors duration-200 ${
                exerciseToday === true
                  ? "border-success bg-success-muted text-success"
                  : "border-[var(--border-subtle)] text-text-muted hover:bg-accent-muted"
              }`}
            >
              Exercise
            </button>
          </div>
          <div>
            <label className="text-xs text-text-muted">
              Screens before bed (min)
            </label>
            <select
              value={screenTimeMinutes ?? ""}
              onChange={(e) =>
                setScreenTimeMinutes(
                  e.target.value === "" ? null : parseInt(e.target.value, 10)
                )
              }
              className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">—</option>
              <option value="0">0</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="90">90</option>
              <option value="120">120+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-200 hover:bg-accent-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
