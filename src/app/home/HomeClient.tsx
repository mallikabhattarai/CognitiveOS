"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PushRegistration } from "@/components/PushRegistration";
import { fetchWithAuth } from "@/lib/fetch";

type PeakWindows = {
  strategic: { start: string; end: string };
  execution: { start: string; end: string };
  recovery: { start: string; end: string };
};

type Prediction = {
  risk_level: "low" | "elevated" | "high";
  triggered_rules: string[];
  protocol_actions: { type: string; text: string }[];
  readiness_score?: number | null;
  edge_score?: number | null;
  strategic_clarity?: string | null;
  emotional_regulation?: string | null;
  cognitive_stamina?: string | null;
  peak_windows?: PeakWindows | null;
  drift_status?: string | null;
  drift_pct_5d?: number | null;
  insights?: string[] | null;
  recommendations?: {
    optimal_bedtime?: string | null;
    nap_suggestion?: string | null;
    wind_down_tip?: string;
  } | null;
};

export function HomeClient({ userId }: { userId: string }) {
  const [todayCheckIn, setTodayCheckIn] = useState<{
    sleep_quality: number;
    mental_clarity: number;
  } | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [sleepCount, setSleepCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [checkInRes, predRes, sleepRes] = await Promise.all([
        fetchWithAuth(`/api/check-in?date=${today}`),
        fetchWithAuth(`/api/prediction?date=${today}`),
        fetchWithAuth("/api/sleep?limit=7"),
      ]);

      if (checkInRes.ok) {
        const data = await checkInRes.json();
        if (data) {
          setTodayCheckIn({
            sleep_quality: data.sleep_quality,
            mental_clarity: data.mental_clarity,
          });
        }
      }
      if (predRes.ok) {
        const data = await predRes.json();
        if (data) setPrediction(data);
      }
      if (sleepRes.ok) {
        const data = await sleepRes.json();
        setSleepCount(data?.length ?? 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-12 space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-lg bg-accent-muted" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-bg-card" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-bg-card" />
      </div>
    );
  }

  const needsMoreSleep = sleepCount !== null && sleepCount < 3;

  return (
    <div className="mt-8 space-y-8">
      <PushRegistration />
      {needsMoreSleep ? (
        <div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-text-primary">
              Log 3 more nights for your first prediction
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Track your sleep to unlock cognitive readiness insights.
            </p>
            <Link
              href="/sleep"
              className="mt-3 inline-block text-sm font-medium text-accent transition-colors duration-200 hover:opacity-80"
            >
              Log sleep →
            </Link>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href="/events"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Event optimization
            </Link>
            <Link
              href="/travel"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Travel impact
            </Link>
          </div>
        </div>
      ) : todayCheckIn ? (
        <div>
          <p className="text-sm text-text-muted">
            Today&apos;s check-in complete
          </p>
          <p className="mt-1 text-base text-text-primary">
            Sleep: {todayCheckIn.sleep_quality}/10 · Clarity:{" "}
            {todayCheckIn.mental_clarity}/10
          </p>
          {prediction?.peak_windows && (
            <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-medium text-text-muted">
                Today&apos;s Cognitive Performance Map
              </p>
              <p className="mt-2 text-sm text-text-primary">
                Your brain is most primed for strategic reasoning between{" "}
                {prediction.peak_windows.strategic.start}–{prediction.peak_windows.strategic.end}.
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#4f7c9e]" />
                  Strategic Peak: {prediction.peak_windows.strategic.start}–{prediction.peak_windows.strategic.end}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#6b5b95]" />
                  Execution Flow: {prediction.peak_windows.execution.start}–{prediction.peak_windows.execution.end}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#5c5c5c]" />
                  Recovery: {prediction.peak_windows.recovery.start}–{prediction.peak_windows.recovery.end}
                </p>
              </div>
            </div>
          )}
          {prediction?.drift_status && prediction.drift_status !== "stable" && prediction.drift_pct_5d != null && prediction.drift_pct_5d < 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-4 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-medium text-text-muted">
                Performance Drift (14-day trend)
              </p>
              <p className="mt-1 text-sm font-medium capitalize text-text-primary">
                {prediction.drift_status.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Your cognitive edge has declined {Math.abs(Math.round(prediction.drift_pct_5d))}% over the last 5 days.
              </p>
            </div>
          )}
          {prediction && (prediction.edge_score ?? prediction.readiness_score) != null && (
            <div className="mt-4">
              <p className="text-xs font-medium text-text-muted">
                Cognitive Edge Score
              </p>
              <div
                className={`mt-1 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold tabular-nums ${
                  (prediction.edge_score ?? prediction.readiness_score ?? 0) >= 70
                    ? "bg-success-muted text-success"
                    : (prediction.edge_score ?? prediction.readiness_score ?? 0) >= 50
                      ? "bg-caution-muted text-caution"
                      : "bg-risk-muted text-risk"
                }`}
              >
                {prediction.edge_score ?? prediction.readiness_score}
              </div>
              {(prediction.strategic_clarity ?? prediction.emotional_regulation ?? prediction.cognitive_stamina) && (
                <div className="mt-2 space-y-0.5 text-xs text-text-muted">
                  {prediction.strategic_clarity && (
                    <p>Strategic Clarity: {prediction.strategic_clarity}</p>
                  )}
                  {prediction.emotional_regulation && (
                    <p>Emotional Regulation: {prediction.emotional_regulation}</p>
                  )}
                  {prediction.cognitive_stamina && (
                    <p>Cognitive Stamina: {prediction.cognitive_stamina}</p>
                  )}
                </div>
              )}
            </div>
          )}
          {prediction?.insights && prediction.insights.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-text-primary">
              {prediction.insights.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-accent">→</span> {i}
                </li>
              ))}
            </ul>
          )}
          {prediction && (
            <div
              className={`relative mt-4 overflow-hidden rounded-2xl border-l-4 p-4 shadow-[var(--shadow-soft)] ${
                prediction.risk_level === "low"
                  ? "border-l-success bg-success-muted"
                  : prediction.risk_level === "elevated"
                    ? "border-l-caution bg-caution-muted"
                    : "border-l-risk bg-risk-muted"
              }`}
            >
              <p className="font-medium text-text-primary">
                {prediction.risk_level === "low"
                  ? "All clear. Your sleep patterns support cognitive performance."
                  : "Your cognitive capacity is trending down in 48–72 hours."}
              </p>
              {prediction.risk_level === "low" && (
                <p className="mt-1 text-xs text-text-muted">
                  Research-backed
                </p>
              )}
              {prediction.protocol_actions?.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-text-primary">
                  {prediction.protocol_actions.map((a, i) => (
                    <li key={i}>• {a.text}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {prediction?.recommendations && (
            <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-medium text-text-muted">
                Today&apos;s tips
              </p>
              <ul className="mt-2 space-y-1 text-sm text-text-primary">
                {prediction.recommendations.wind_down_tip && (
                  <li>• {prediction.recommendations.wind_down_tip}</li>
                )}
                {prediction.recommendations.optimal_bedtime && (
                  <li>
                    • Optimal bedtime: {prediction.recommendations.optimal_bedtime}
                  </li>
                )}
                {prediction.recommendations.nap_suggestion && (
                  <li>• {prediction.recommendations.nap_suggestion}</li>
                )}
              </ul>
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Link
              href="/events"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Event optimization
            </Link>
            <Link
              href="/travel"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Travel impact
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-text-primary">
            Daily check-in
          </p>
          <p className="mt-1 text-sm text-text-muted">
            How did you sleep? How&apos;s your mental clarity?
          </p>
          <Link
            href="/check-in"
            className="mt-3 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90"
          >
            Complete check-in
          </Link>
          <div className="mt-6 flex gap-3">
            <Link
              href="/events"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Event optimization
            </Link>
            <Link
              href="/travel"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-2.5 text-center text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
            >
              Travel impact
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
