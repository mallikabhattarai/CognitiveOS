import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateRules } from "./rules";
import { getProtocolActions, getRecommendations } from "./protocols";
import { getPredictiveInsights, computeSleepDebt } from "./insights";
import { computeEdgeScore } from "@/lib/readiness/score";
import { computePeakWindows } from "@/lib/peak-windows/engine";
import { computeDailyScores, computeDrift } from "@/lib/drift/tracker";
import {
  computeCircadianAlignment,
  computeSleepPressure,
  computeCognitiveWindows,
  computeProjection72h,
  computeSleepArchitecture,
  computeSleepAge,
} from "@/lib/physiological";

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
  model_version: "research_v1" | "research_v2";
  circadian_alignment_pct?: number | null;
  biological_readiness_time?: string | null;
  bedtime_vs_brt_minutes?: number | null;
  avg_bedtime_7d?: string | null;
  circadian_interpretation?: string | null;
  sleep_pressure_pct?: number | null;
  cognitive_dip_window?: { start: string; end: string } | null;
  recovery_time_estimate?: number | null;
  cognitive_windows?: {
    deep_work: { start: string; end: string };
    emotional_regulation: { start: string; end: string };
    reaction_time_dip: { start: string; end: string };
    creative_insight: { start: string; end: string };
  } | null;
  projection_72h?: {
    baseline: { hour_offset: number; score: number }[];
    recovery: { hour_offset: number; score: number }[];
    partial: { hour_offset: number; score: number }[];
    bedtime_advance_minutes: number;
  } | null;
  predicted_n3_pct?: number | null;
  predicted_rem_pct?: number | null;
  fragmentation_risk?: number | null;
  predicted_efficiency?: number | null;
  rem_shift_note?: string | null;
  cognitive_sleep_age?: number | null;
  sleep_age_driver?: string | null;
  edge_breakdown?: {
    sleep_pressure: number;
    circadian_timing: number;
    architecture_stability: number;
    fragmentation_risk: number;
  } | null;
};

export async function runPrediction(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<PredictionResult | null> {
  const { data: sleepRecords } = await supabase
    .from("sleep_records")
    .select(
      "date, duration_minutes, quality_rating, bedtime, wake_time, caffeine_after_2pm, alcohol_tonight, screen_time_minutes, exercise_today, nap_duration_minutes"
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
    .select("chronotype, age")
    .eq("id", userId)
    .single();

  const chronotype = (profile?.chronotype as "early" | "intermediate" | "late") ?? "intermediate";
  const age = profile?.age as number | null ?? null;

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

  const circadian = computeCircadianAlignment(
    sleepRecords,
    sleepRecords[0]?.bedtime ?? null,
    chronotype
  );
  const sleepPressure = computeSleepPressure(sleepRecords);
  const sleepPressurePct = sleepPressure?.sleep_pressure_pct ?? 0;
  const circadianAlignmentPct = circadian?.circadian_alignment_pct ?? 70;

  const architecture = computeSleepArchitecture(
    sleepRecords[0],
    sleepRecords,
    circadianAlignmentPct,
    age
  );

  const cognitiveWindows = computeCognitiveWindows(
    sleepRecords[0],
    sleepRecords,
    sleepPressurePct,
    chronotype
  );

  const dailyScores = computeDailyScores(sleepRecords, checkIns ?? []);
  const drift = computeDrift(dailyScores);
  const currentEdgeScore =
    dailyScores.length > 0 ? dailyScores[dailyScores.length - 1].edge_score : 70;

  const projection72h = computeProjection72h(
    sleepRecords,
    circadianAlignmentPct,
    currentEdgeScore
  );

  const sleepAge = computeSleepAge(
    architecture,
    age,
    Math.round((circadianAlignmentPct + (100 - architecture.fragmentation_risk)) / 2)
  );

  const physiological: import("@/lib/readiness/score").PhysiologicalInputs = {
    sleep_pressure_pct: sleepPressurePct,
    circadian_alignment_pct: circadianAlignmentPct,
    predicted_n3_pct: architecture.predicted_n3_pct,
    predicted_rem_pct: architecture.predicted_rem_pct,
    predicted_efficiency: architecture.predicted_efficiency,
    fragmentation_risk: architecture.fragmentation_risk,
    consistency_score: Math.round(
      (100 - architecture.fragmentation_risk + circadianAlignmentPct) / 2
    ),
  };

  const edgeResult = computeEdgeScore(
    sleepRecords[0],
    sleepRecords,
    todayCheckIn,
    physiological
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
    model_version: "research_v2",
    circadian_alignment_pct: circadian?.circadian_alignment_pct ?? null,
    biological_readiness_time: circadian?.biological_readiness_time ?? null,
    bedtime_vs_brt_minutes: circadian?.bedtime_vs_brt_minutes ?? null,
    avg_bedtime_7d: circadian?.avg_bedtime_7d ?? null,
    circadian_interpretation: circadian?.interpretation ?? null,
    sleep_pressure_pct: sleepPressure?.sleep_pressure_pct ?? null,
    cognitive_dip_window: sleepPressure?.cognitive_dip_window ?? null,
    recovery_time_estimate: sleepPressure?.recovery_time_estimate ?? null,
    cognitive_windows: cognitiveWindows,
    projection_72h: projection72h,
    predicted_n3_pct: architecture.predicted_n3_pct,
    predicted_rem_pct: architecture.predicted_rem_pct,
    fragmentation_risk: architecture.fragmentation_risk,
    predicted_efficiency: architecture.predicted_efficiency,
    rem_shift_note: architecture.rem_shift_note ?? null,
    cognitive_sleep_age: sleepAge?.cognitive_sleep_age ?? null,
    sleep_age_driver: sleepAge?.sleep_age_driver ?? null,
    edge_breakdown: edgeResult.breakdown ?? null,
  };
}
