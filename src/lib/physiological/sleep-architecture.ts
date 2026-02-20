/**
 * Module C: Sleep Architecture Projection Engine
 * Estimates stage distribution (N3, REM) based on behavior and timing.
 */

export type SleepArchitectureResult = {
  predicted_n3_pct: number;
  predicted_rem_pct: number;
  fragmentation_risk: number;
  predicted_efficiency: number;
  rem_shift_note: string | null;
};

type SleepRecord = {
  duration_minutes: number | null;
  bedtime: string | null;
  alcohol_tonight?: boolean | null;
  screen_time_minutes?: number | null;
};

type Chronotype = "early" | "intermediate" | "late";

function getN3Baseline(age: number | null): number {
  if (age == null) return 18;
  if (age < 30) return 22;
  if (age < 40) return 18;
  if (age < 50) return 15;
  return 12;
}

function getREMBaseline(): number {
  return 22;
}

export function computeSleepArchitecture(
  latestSleep: SleepRecord | null,
  recentSleep: SleepRecord[],
  circadianAlignmentPct: number,
  age: number | null
): SleepArchitectureResult {
  let n3Pct = getN3Baseline(age);
  let remPct = getREMBaseline();
  let fragmentationRisk = 20;
  let efficiency = 85;
  let remShiftNote: string | null = null;

  if (latestSleep) {
    const durationHours = (latestSleep.duration_minutes ?? 420) / 60;
    if (durationHours < 6) {
      n3Pct -= 4;
      remPct -= 3;
      efficiency -= 8;
    } else if (durationHours < 7) {
      n3Pct -= 2;
      remPct -= 2;
      efficiency -= 4;
    }

    if (latestSleep.alcohol_tonight) {
      n3Pct -= 2;
      remPct -= 5;
      fragmentationRisk += 25;
      efficiency -= 5;
    }

    if (latestSleep.screen_time_minutes != null) {
      if (latestSleep.screen_time_minutes >= 90) {
        fragmentationRisk += 15;
        efficiency -= 5;
      } else if (latestSleep.screen_time_minutes >= 60) {
        fragmentationRisk += 8;
      }
    }
  }

  if (circadianAlignmentPct < 60) {
    remShiftNote = "REM distribution may shift later due to delayed bedtime.";
  }

  const consistency = scoreConsistency(recentSleep);
  if (consistency < 60) fragmentationRisk += 20;
  else if (consistency < 80) fragmentationRisk += 10;

  return {
    predicted_n3_pct: Math.max(8, Math.min(28, Math.round(n3Pct * 10) / 10)),
    predicted_rem_pct: Math.max(12, Math.min(28, Math.round(remPct * 10) / 10)),
    fragmentation_risk: Math.min(95, Math.round(fragmentationRisk)),
    predicted_efficiency: Math.max(65, Math.min(98, Math.round(efficiency))),
    rem_shift_note: remShiftNote,
  };
}

function scoreConsistency(records: SleepRecord[]): number {
  if (records.length < 5) return 80;
  const withTimes = records
    .slice(0, 5)
    .filter((r) => r.bedtime)
    .map((r) => new Date(r.bedtime!).getTime());
  if (withTimes.length < 5) return 80;
  const min = Math.min(...withTimes);
  const max = Math.max(...withTimes);
  const varianceHours = (max - min) / (1000 * 60 * 60);
  if (varianceHours <= 1) return 100;
  if (varianceHours <= 2) return 80;
  if (varianceHours <= 3) return 60;
  return 40;
}
