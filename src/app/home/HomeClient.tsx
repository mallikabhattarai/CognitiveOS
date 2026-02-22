"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { PushRegistration } from "@/components/PushRegistration";
import { fetchWithAuth } from "@/lib/fetch";

type PeakWindows = {
  strategic: { start: string; end: string };
  execution: { start: string; end: string };
  recovery: { start: string; end: string };
};

type CognitiveWindows = {
  deep_work: { start: string; end: string };
  emotional_regulation: { start: string; end: string };
  reaction_time_dip: { start: string; end: string };
  creative_insight: { start: string; end: string };
};

type EdgeBreakdown = {
  sleep_pressure: number;
  circadian_timing: number;
  architecture_stability: number;
  fragmentation_risk: number;
};

type Projection72h = {
  baseline: { hour_offset: number; score: number }[];
  recovery: { hour_offset: number; score: number }[];
  partial: { hour_offset: number; score: number }[];
  bedtime_advance_minutes: number;
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
  circadian_alignment_pct?: number | null;
  biological_readiness_time?: string | null;
  bedtime_vs_brt_minutes?: number | null;
  avg_bedtime_7d?: string | null;
  sleep_pressure_pct?: number | null;
  cognitive_dip_window?: { start: string; end: string } | null;
  recovery_time_estimate?: number | null;
  cognitive_windows?: CognitiveWindows | null;
  projection_72h?: Projection72h | null;
  cognitive_sleep_age?: number | null;
  sleep_age_driver?: string | null;
  edge_breakdown?: EdgeBreakdown | null;
};

function getStatusLabel(
  edgeScore: number,
  riskLevel: "low" | "elevated" | "high"
): string {
  if (riskLevel !== "low") return "Prioritize sleep tonight";
  if (edgeScore >= 70) return "Ready for deep work";
  if (edgeScore >= 50) return "Moderate recovery needed";
  return "Prioritize sleep tonight";
}

function barColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 50) return "var(--caution)";
  return "var(--risk)";
}

const CARD_CLASS =
  "rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-medium)]";
const SECTION_LABEL = "text-xs font-semibold uppercase tracking-wider text-text-muted";

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
        fetchWithAuth(`/api/prediction?date=${today}`, { cache: "no-store" }),
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
      <div className="mt-12 space-y-6 pb-20">
        <div className="h-4 w-32 animate-pulse rounded-lg bg-accent-muted" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-bg-card" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-bg-card" />
      </div>
    );
  }

  const needsMoreSleep = sleepCount !== null && sleepCount < 3;
  const edgeScore = prediction?.edge_score ?? prediction?.readiness_score ?? 0;
  const riskLevel = prediction?.risk_level ?? "low";

  const projectionChartData =
    prediction?.projection_72h?.baseline?.map((p, i) => ({
      hours: p.hour_offset,
      baseline: prediction.projection_72h!.baseline[i]?.score,
      recovery: prediction.projection_72h!.recovery[i]?.score,
      partial: prediction.projection_72h!.partial[i]?.score,
    })) ?? [];

  return (
    <div className="mt-8 space-y-6 pb-20">
      <PushRegistration />

      {needsMoreSleep ? (
        <div className="space-y-6">
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Progress
            </p>
            <p className="mt-2 text-base font-medium text-text-primary">
              {sleepCount ?? 0} of 3 nights logged
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Log 3 more nights to unlock predictions
            </p>
            <Link
              href="/sleep"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90"
            >
              Log sleep
            </Link>
          </div>
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Tools
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/simulate"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] ring-2 ring-accent/20 transition-all duration-200 hover:opacity-90 hover:shadow-[var(--shadow-medium)] hover:ring-accent/40"
              >
                What If
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/events"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Event optimization
                </Link>
                <Link
                  href="/travel"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Travel impact
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : todayCheckIn ? (
        <div className="space-y-6">
          {/* 1. Hero: Cognitive Edge + Status + Breakdown (merged) */}
          {prediction && (edgeScore > 0 || prediction.edge_breakdown) && (
            <div
              className={`relative overflow-hidden rounded-2xl p-6 shadow-[var(--shadow-card)] ${
                edgeScore >= 70
                  ? "bg-success-muted border border-success/25"
                  : edgeScore >= 50
                    ? "bg-caution-muted border border-caution/25"
                    : "bg-risk-muted border border-risk/25"
              }`}
            >
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className={SECTION_LABEL}>
                    Cognitive Edge
                  </p>
                  <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-text-primary">
                    {edgeScore}
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary leading-relaxed">
                    {getStatusLabel(edgeScore, riskLevel)}
                  </p>
                  {riskLevel === "low" && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      Research-backed
                    </span>
                  )}
                </div>
              </div>
              {prediction.edge_breakdown ? (
                <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold tabular-nums ${
                        edgeScore >= 70
                          ? "bg-success/20 text-success"
                          : edgeScore >= 50
                            ? "bg-caution/20 text-caution"
                            : "bg-risk/20 text-risk"
                      }`}
                    >
                      {edgeScore}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      {(
                        [
                          ["Sleep Pressure", prediction.edge_breakdown.sleep_pressure],
                          ["Circadian", prediction.edge_breakdown.circadian_timing],
                          ["Architecture", prediction.edge_breakdown.architecture_stability],
                          ["Fragmentation", prediction.edge_breakdown.fragmentation_risk],
                        ] as const
                      ).map(([label, val]) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-xs text-text-muted">
                            {label}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${val}%`,
                                backgroundColor: barColor(val),
                              }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-primary">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                (prediction.strategic_clarity ??
                  prediction.emotional_regulation ??
                  prediction.cognitive_stamina) && (
                  <div className="mt-5 border-t border-[var(--border-subtle)] pt-5 space-y-0.5 text-xs text-text-muted">
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
                )
              )}
            </div>
          )}

          {/* 2. Check-in summary (compact) */}
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Today&apos;s check-in
            </p>
            <p className="mt-2 text-lg font-medium tabular-nums text-text-primary">
              Sleep: {todayCheckIn.sleep_quality}/10 · Clarity: {todayCheckIn.mental_clarity}/10
            </p>
          </div>

          {/* 3. Risk / Protocol Alert */}
          {prediction && riskLevel !== "low" && (
            <div
              className={`relative overflow-hidden rounded-2xl border-l-4 p-5 shadow-[var(--shadow-soft)] ${
                riskLevel === "elevated"
                  ? "border-l-caution bg-caution-muted"
                  : "border-l-risk bg-risk-muted"
              }`}
            >
              <div className="flex gap-3">
                <span
                  className="text-2xl"
                  aria-hidden
                >
                  {riskLevel === "high" ? "⚠" : "◐"}
                </span>
                <div>
                  <p className="font-semibold text-text-primary">
                    {riskLevel === "high"
                      ? "Your cognitive capacity may trend downward in 48–72 hours."
                      : "Moderate risk. Consider adjusting your sleep."}
                  </p>
                  {prediction.protocol_actions?.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {prediction.protocol_actions.map((a, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-text-primary"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-card/80 text-xs font-medium">
                            {i + 1}
                          </span>
                          {a.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Cognitive Map (timeline) */}
          {prediction?.cognitive_windows && (
            <div className={CARD_CLASS}>
              <p className={SECTION_LABEL}>
                Tomorrow&apos;s Cognitive Map
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-3">
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Best for focused work
                    </p>
                    <p className="font-mono text-sm text-text-muted">
                      {prediction.cognitive_windows.deep_work.start}–
                      {prediction.cognitive_windows.deep_work.end}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-caution-muted p-3">
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-caution" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Post-lunch dip likely
                    </p>
                    <p className="font-mono text-sm text-text-muted">
                      {prediction.cognitive_windows.reaction_time_dip.start}–
                      {prediction.cognitive_windows.reaction_time_dip.end}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-accent-muted p-3">
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-[#6b5b95]" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Creative ideation may peak
                    </p>
                    <p className="font-mono text-sm text-text-muted">
                      {prediction.cognitive_windows.creative_insight.start}–
                      {prediction.cognitive_windows.creative_insight.end}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Sleep Pressure (gauge) */}
          {prediction?.sleep_pressure_pct != null && (
            <div className={CARD_CLASS}>
              <p className={SECTION_LABEL}>
                Sleep Pressure
              </p>
              <div className="mt-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, prediction.sleep_pressure_pct + 20)}%`,
                      background:
                        prediction.sleep_pressure_pct > 20
                          ? "linear-gradient(90deg, var(--caution), var(--risk))"
                          : prediction.sleep_pressure_pct > 10
                            ? "linear-gradient(90deg, var(--success), var(--caution))"
                            : "var(--success)",
                    }}
                  />
                </div>
                <p className="mt-2 text-lg font-medium tabular-nums text-text-primary">
                  {prediction.sleep_pressure_pct}% above baseline
                </p>
                {prediction.cognitive_dip_window && (
                  <p className="mt-1 text-sm text-text-muted">
                    Dip likely: <span className="font-mono text-text-primary">{prediction.cognitive_dip_window.start}–{prediction.cognitive_dip_window.end}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 6. Circadian Alignment */}
          {prediction?.circadian_alignment_pct != null &&
            prediction.biological_readiness_time && (
              <div className={CARD_CLASS}>
                <p className={SECTION_LABEL}>
                  Circadian Alignment
                </p>
                <p className="mt-4 text-3xl font-bold tabular-nums text-text-primary">
                  {prediction.circadian_alignment_pct}%
                </p>
                <div className="mt-3 space-y-1 text-sm text-text-muted leading-relaxed">
                  {prediction.avg_bedtime_7d && (
                    <p>
                      Avg bedtime:{" "}
                      <span className="font-mono text-text-primary">
                        {prediction.avg_bedtime_7d}
                      </span>
                    </p>
                  )}
                  <p>
                    Biological readiness:{" "}
                    <span className="font-mono text-text-primary">
                      {prediction.biological_readiness_time}
                    </span>
                  </p>
                  {prediction.bedtime_vs_brt_minutes != null && (
                    <p>
                      Tonight ~{Math.abs(prediction.bedtime_vs_brt_minutes)} min{" "}
                      {prediction.bedtime_vs_brt_minutes < 0 ? "before" : "after"}{" "}
                      alignment window
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* 7. 72-Hour Forecast */}
          {projectionChartData.length > 0 && prediction?.projection_72h && (
            <div className={CARD_CLASS}>
              <p className={SECTION_LABEL}>
                72-Hour Forecast
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Advance bedtime by {prediction.projection_72h.bedtime_advance_minutes} min for improved recovery
              </p>
              <div className="mt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionChartData}>
                    <defs>
                      <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="hours"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v}h`}
                      label={{ value: "Hours from now", position: "insideBottom", offset: -5, fontSize: 10 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [value ?? 0, "Score"]}
                      labelFormatter={(label) => `${label}h`}
                    />
                    <ReferenceLine y={70} stroke="var(--success)" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      name="Baseline"
                      stroke="var(--text-muted)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="recovery"
                      name="Recovery"
                      stroke="var(--success)"
                      strokeWidth={2}
                      fill="url(#recoveryGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="partial"
                      name="Partial"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 9. Sleep Age */}
          {prediction?.cognitive_sleep_age != null &&
            prediction.sleep_age_driver && (
              <div className={CARD_CLASS}>
                <p className={SECTION_LABEL}>
                  Sleep Age
                </p>
                <p className="mt-2 text-lg font-medium text-text-primary">
                  {prediction.cognitive_sleep_age} years
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Driver: {prediction.sleep_age_driver}
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  Not a clinical assessment
                </p>
              </div>
            )}

          {/* 10. Peak windows fallback */}
          {prediction?.peak_windows && !prediction.cognitive_windows && (
            <div className={CARD_CLASS}>
              <p className={SECTION_LABEL}>
                Cognitive Map
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  Strategic: {prediction.peak_windows.strategic.start}–
                  {prediction.peak_windows.strategic.end}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#6b5b95]" />
                  Execution: {prediction.peak_windows.execution.start}–
                  {prediction.peak_windows.execution.end}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-text-muted" />
                  Recovery: {prediction.peak_windows.recovery.start}–
                  {prediction.peak_windows.recovery.end}
                </p>
              </div>
            </div>
          )}

          {/* 11. Drift */}
          {prediction?.drift_status &&
            prediction.drift_status !== "stable" &&
            prediction.drift_pct_5d != null &&
            prediction.drift_pct_5d < 0 && (
              <div className={CARD_CLASS}>
                <p className={SECTION_LABEL}>
                  Drift
                </p>
                <p className="mt-2 text-sm font-medium capitalize text-text-primary">
                  {prediction.drift_status.replace(/_/g, " ")} · {Math.abs(Math.round(prediction.drift_pct_5d))}% over 5 days
                </p>
              </div>
            )}

          {/* 12. Insights */}
          {prediction?.insights && prediction.insights.length > 0 && (
            <ul className="space-y-2 text-sm text-text-primary leading-relaxed">
              {prediction.insights.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-accent">→</span> {i}
                </li>
              ))}
            </ul>
          )}

          {/* 13. Low-risk positive message */}
          {prediction && riskLevel === "low" && !prediction.protocol_actions?.length && (
            <div className="rounded-2xl border border-success/20 border-l-4 border-l-success bg-success-muted p-5 shadow-[var(--shadow-card)]">
              <p className="font-medium text-text-primary">
                All clear
              </p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                Research-backed
              </span>
            </div>
          )}

          {/* 14. Recommendations */}
          {prediction?.recommendations && (
            <div className={CARD_CLASS}>
              <p className={SECTION_LABEL}>
                Tips
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-primary leading-relaxed">
                {prediction.recommendations.wind_down_tip && (
                  <li>• {prediction.recommendations.wind_down_tip}</li>
                )}
                {prediction.recommendations.optimal_bedtime && (
                  <li>• Optimal bedtime: {prediction.recommendations.optimal_bedtime}</li>
                )}
                {prediction.recommendations.nap_suggestion && (
                  <li>• {prediction.recommendations.nap_suggestion}</li>
                )}
              </ul>
            </div>
          )}

          {/* 15. Tools card */}
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Tools
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/simulate"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] ring-2 ring-accent/20 transition-all duration-200 hover:opacity-90 hover:shadow-[var(--shadow-medium)] hover:ring-accent/40"
              >
                What If
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/events"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Event optimization
                </Link>
                <Link
                  href="/travel"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Travel impact
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Check-in
            </p>
            <p className="mt-2 text-base font-medium text-text-primary">
              How are you feeling today?
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Calibrates readiness and improves predictions
            </p>
            <Link
              href="/check-in"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90"
            >
              Complete check-in
            </Link>
          </div>
          <div className={CARD_CLASS}>
            <p className={SECTION_LABEL}>
              Tools
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/simulate"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] ring-2 ring-accent/20 transition-all duration-200 hover:opacity-90 hover:shadow-[var(--shadow-medium)] hover:ring-accent/40"
              >
                What If
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/events"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Event optimization
                </Link>
                <Link
                  href="/travel"
                  className="rounded-lg border border-[var(--border-subtle)] bg-bg-muted px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-muted"
                >
                  Travel impact
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
