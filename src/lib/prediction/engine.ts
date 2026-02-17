import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateRules } from "./rules";
import { getProtocolActions, getRecommendations } from "./protocols";
import { getPredictiveInsights, computeSleepDebt } from "./insights";
import { computeEdgeScore } from "@/lib/readiness/score";
import { computePeakWindows } from "@/lib/peak-windows/engine";
import { computeDailyScores, computeDrift } from "@/lib/drift/tracker";

export type PredictionResult = {
  risk_level: "low" | "elevated" | "high";
  risk_horizon_hours: number | null;
  triggered_rules: string[];
  protocol_actions: { type: string; text: string }[];
  readiness_score: number;
  edge_score: number;
  strategic_clarity: string;
  emotional_regulation: string;
  cognitive_stamina: string;
  peak_windows: { strategic: { start: string; end: string }; execution: { start: string; end: string }; recovery: { start: string; end: string } } | null;
  drift_status: string | null;
  drift_pct_5d: number | null;
  insights: string[];
  recommendations: {
    optimal_bedtime: string | null;
    nap_suggestion: string | null;
    wind_down_tip: string;
  };
};

export async function runPrediction(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<PredictionResult | null> {
  const { data: sleepRecords } = await supabase
    .from("sleep_records")
    .select(
      "date, duration_minutes, quality_rating, bedtime, wake_time, caffeine_after_2pm, alcohol_tonight, screen_time_minutes, exercise_today"
    )
    .eq("user_id", userId)
    .lte("date", date)
    .order("date", { ascending: false })
    .limit(14);

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("date, mental_clarity, energy_rating, stress_level")
    .eq("user_id", userId)
    .lte("date", date)
    .order("date", { ascending: false })
    .limit(14);

  if (!sleepRecords || sleepRecords.length < 3) {
    return null;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("chronotype")
    .eq("id", userId)
    .single();

  const chronotype = (profile?.chronotype as "early" | "intermediate" | "late") ?? "intermediate";

  const triggered = evaluateRules(sleepRecords, checkIns ?? []);

  let risk_level: "low" | "elevated" | "high" = "low";
  if (triggered.includes("chronic_short_sleep")) {
    risk_level = "high";
  } else if (triggered.length >= 2) {
    risk_level = "high";
  } else if (triggered.length === 1) {
    risk_level = "elevated";
  }

  const protocol_actions = getProtocolActions(triggered, risk_level);
  const todayCheckIn = checkIns?.find((c) => c.date === date) ?? null;
  const edgeResult = computeEdgeScore(
    sleepRecords[0],
    sleepRecords,
    todayCheckIn
  );
  const insights = getPredictiveInsights(triggered, sleepRecords);
  const sleepDebt = computeSleepDebt(sleepRecords);
  const recommendations = getRecommendations(sleepRecords, sleepDebt);

  const peak_windows = computePeakWindows(
    sleepRecords[0],
    sleepRecords,
    checkIns ?? [],
    chronotype
  );

  const dailyScores = computeDailyScores(sleepRecords, checkIns ?? []);
  const drift = computeDrift(dailyScores);

  return {
    risk_level,
    risk_horizon_hours: risk_level !== "low" ? 72 : null,
    triggered_rules: triggered,
    protocol_actions,
    readiness_score: edgeResult.edge_score,
    edge_score: edgeResult.edge_score,
    strategic_clarity: edgeResult.strategic_clarity,
    emotional_regulation: edgeResult.emotional_regulation,
    cognitive_stamina: edgeResult.cognitive_stamina,
    peak_windows,
    drift_status: drift?.status ?? null,
    drift_pct_5d: drift?.drift_pct_5d ?? null,
    insights,
    recommendations,
  };
}
