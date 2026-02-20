/**
 * Module D: 72-Hour Cognitive Projection Model
 * Forecasts performance trajectory: baseline, recovery, partial (nap).
 */

export type ProjectionPoint = { hour_offset: number; score: number };

export type Projection72hResult = {
  baseline: ProjectionPoint[];
  recovery: ProjectionPoint[];
  partial: ProjectionPoint[];
  bedtime_advance_minutes: number;
};

type SleepRecord = {
  date: string;
  duration_minutes: number | null;
  bedtime: string | null;
  wake_time: string | null;
};

const TARGET_SLEEP_MINUTES = 450;
const HOURS = [0, 12, 24, 36, 48, 60, 72];

function computeSleepDebt(records: SleepRecord[]): number {
  let debt = 0;
  for (const r of records.slice(0, 5)) {
    if (r.duration_minutes != null && r.duration_minutes < TARGET_SLEEP_MINUTES) {
      debt += TARGET_SLEEP_MINUTES - r.duration_minutes;
    }
  }
  return debt;
}

function getWakeTimeVariance(records: SleepRecord[]): number {
  if (records.length < 5) return 0;
  const withWake = records
    .slice(0, 5)
    .filter((r) => r.wake_time)
    .map((r) => new Date(r.wake_time!).getTime());
  if (withWake.length < 5) return 0;
  const min = Math.min(...withWake);
  const max = Math.max(...withWake);
  return (max - min) / (1000 * 60 * 60);
}

export function computeProjection72h(
  recentSleep: SleepRecord[],
  circadianAlignmentPct: number,
  currentEdgeScore: number
): Projection72hResult {
  const sleepDebt = computeSleepDebt(recentSleep);
  const varianceHours = getWakeTimeVariance(recentSleep);
  const misalignment = 100 - circadianAlignmentPct;

  const debtImpact = Math.min(30, (sleepDebt / 120) * 15);
  const varianceImpact = Math.min(15, varianceHours * 5);
  const alignImpact = Math.min(25, (misalignment / 100) * 25);

  const declinePerDay = (debtImpact + varianceImpact + alignImpact) / 3;

  const baseline = HOURS.map((h) => ({
    hour_offset: h,
    score: Math.max(20, Math.min(100, currentEdgeScore - (h / 24) * declinePerDay)),
  }));

  const recoverySlope = declinePerDay * 0.4;
  const recovery = HOURS.map((h) => ({
    hour_offset: h,
    score: Math.max(20, Math.min(100, currentEdgeScore - (h / 24) * recoverySlope + 5)),
  }));

  const partialSlope = declinePerDay * 0.7;
  const partial = HOURS.map((h) => ({
    hour_offset: h,
    score: Math.max(20, Math.min(100, currentEdgeScore - (h / 24) * partialSlope + 3)),
  }));

  const bedtimeAdvance = Math.min(60, Math.max(40, Math.round(misalignment / 2)));

  return {
    baseline,
    recovery,
    partial,
    bedtime_advance_minutes: bedtimeAdvance,
  };
}
