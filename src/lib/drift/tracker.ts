/**
 * Cognitive Drift Tracker
 * Computes 14-day drift status and 5-day erosion percentage.
 */

import { computeEdgeScore } from "@/lib/readiness/score";

export type DriftStatus = "stable" | "slight_compression" | "accumulating_fatigue" | "edge_erosion";

export type DriftResult = {
  status: DriftStatus;
  drift_pct_14d: number;
  drift_pct_5d: number;
};

export type DailyScore = { date: string; edge_score: number };

export function computeDailyScores(
  sleepRecords: Array<{
    date: string;
    duration_minutes: number | null;
    quality_rating: number | null;
    bedtime: string | null;
    wake_time: string | null;
    caffeine_after_2pm?: boolean | null;
    alcohol_tonight?: boolean | null;
    screen_time_minutes?: number | null;
    exercise_today?: boolean | null;
  }>,
  checkIns: Array<{
    date: string;
    mental_clarity: number | null;
    energy_rating: number | null;
    stress_level: number | null;
  }>
): DailyScore[] {
  const scores: DailyScore[] = [];
  const sortedSleep = [...sleepRecords].sort((a, b) => b.date.localeCompare(a.date));
  const checkInByDate = new Map(checkIns.map((c) => [c.date, c]));

  for (const sleep of sortedSleep) {
    const date = sleep.date;
    const recentSleep = sortedSleep.filter((s) => s.date <= date).slice(0, 14);
    const todayCheckIn = checkInByDate.get(date) ?? null;
    const result = computeEdgeScore(sleep, recentSleep, todayCheckIn);
    scores.push({ date, edge_score: result.edge_score });
  }

  return scores.sort((a, b) => a.date.localeCompare(b.date));
}

export function computeDrift(scores: { date: string; edge_score: number }[]): DriftResult | null {
  if (scores.length < 3) return null;

  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
  const oldest = sorted[0].edge_score;
  const newest = sorted[sorted.length - 1].edge_score;

  const pct14 = oldest > 0 ? ((newest - oldest) / oldest) * 100 : 0;

  let pct5 = 0;
  if (scores.length >= 5) {
    const last5 = sorted.slice(-5);
    const fiveDaysAgo = last5[0].edge_score;
    const today = last5[last5.length - 1].edge_score;
    pct5 = fiveDaysAgo > 0 ? ((today - fiveDaysAgo) / fiveDaysAgo) * 100 : 0;
  }

  const decline14 = -pct14;
  const decline5 = -pct5;

  let status: DriftStatus = "stable";
  if (decline14 >= 20) status = "edge_erosion";
  else if (decline14 >= 10) status = "accumulating_fatigue";
  else if (decline14 >= 5) status = "slight_compression";

  return {
    status,
    drift_pct_14d: Math.round(pct14 * 10) / 10,
    drift_pct_5d: Math.round(pct5 * 10) / 10,
  };
}
