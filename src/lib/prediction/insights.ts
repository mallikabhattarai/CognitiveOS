/**
 * Forward-looking predictive insights (rules-based).
 */

type SleepRecord = {
  date: string;
  duration_minutes: number | null;
  quality_rating: number | null;
  bedtime: string | null;
  wake_time: string | null;
};

export function getPredictiveInsights(
  triggeredRules: string[],
  sleepRecords: SleepRecord[]
): string[] {
  const insights: string[] = [];

  if (triggeredRules.includes("short_sleep_3_nights")) {
    insights.push("Aim for 7+ hours tonight to recover.");
  }
  if (triggeredRules.includes("chronic_short_sleep")) {
    insights.push("Prioritize sleep for 2–3 nights to restore cognitive capacity.");
  }
  if (triggeredRules.includes("sleep_midpoint_shift")) {
    insights.push("Stabilize bedtime tonight for better focus tomorrow.");
  }

  const sleepDebt = computeSleepDebt(sleepRecords);
  if (sleepDebt > 120) {
    insights.push("Sleep debt building – consider a wind-down routine tonight.");
  }

  const last3 = sleepRecords.slice(0, 3);
  const shortCount = last3.filter(
    (r) => r.duration_minutes != null && r.duration_minutes < 420
  ).length;
  if (shortCount >= 2 && !insights.some((i) => i.includes("7+ hours"))) {
    insights.push("Based on last 3 nights, your cognitive performance may dip tomorrow.");
  }

  return insights.slice(0, 2);
}

export function computeSleepDebt(records: SleepRecord[]): number {
  const targetMinutes = 450;
  let debt = 0;
  for (const r of records.slice(0, 5)) {
    if (r.duration_minutes != null && r.duration_minutes < targetMinutes) {
      debt += targetMinutes - r.duration_minutes;
    }
  }
  return debt;
}
