/**
 * Peak Performance Windows
 * Computes strategic, execution, and recovery windows based on sleep, chronotype, and trends.
 */

export type PeakWindow = { start: string; end: string };

export type PeakWindowsResult = {
  strategic: PeakWindow;
  execution: PeakWindow;
  recovery: PeakWindow;
};

type Chronotype = "early" | "intermediate" | "late";

type SleepRecord = {
  duration_minutes: number | null;
  bedtime: string | null;
  wake_time: string | null;
};

type CheckIn = {
  mental_clarity: number | null;
  stress_level: number | null;
};

const CHRONO_BASE: Record<Chronotype, { strategic: PeakWindow; execution: PeakWindow; recovery: PeakWindow }> = {
  early: {
    strategic: { start: "08:00", end: "11:00" },
    execution: { start: "11:00", end: "14:00" },
    recovery: { start: "14:00", end: "18:00" },
  },
  intermediate: {
    strategic: { start: "09:00", end: "12:00" },
    execution: { start: "12:00", end: "15:00" },
    recovery: { start: "15:00", end: "19:00" },
  },
  late: {
    strategic: { start: "10:00", end: "13:00" },
    execution: { start: "13:00", end: "16:00" },
    recovery: { start: "16:00", end: "20:00" },
  },
};

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function shrinkWindow(start: string, end: string, shrinkPct: number): PeakWindow {
  const s = parseTime(start);
  const e = parseTime(end);
  const span = e - s;
  const newSpan = Math.max(60, Math.round(span * (1 - shrinkPct / 100)));
  const shift = Math.round((span - newSpan) / 2);
  return {
    start: formatTime(s + shift),
    end: formatTime(s + shift + newSpan),
  };
}

function shiftEarlier(start: string, end: string, minutes: number): PeakWindow {
  const s = parseTime(start);
  const e = parseTime(end);
  return {
    start: formatTime(Math.max(0, s - minutes)),
    end: formatTime(Math.max(0, e - minutes)),
  };
}

export function computePeakWindows(
  latestSleep: SleepRecord | null,
  recentSleep: SleepRecord[],
  recentCheckIns: CheckIn[],
  chronotype: Chronotype = "intermediate"
): PeakWindowsResult {
  const base = CHRONO_BASE[chronotype];
  let strategic = { ...base.strategic };
  let execution = { ...base.execution };
  let recovery = { ...base.recovery };

  let shrinkPct = 0;
  let shiftMinutes = 0;

  // Short sleep → shrink ~20%, shift earlier ~30min
  const durationHours = (latestSleep?.duration_minutes ?? 480) / 60;
  if (durationHours < 6) {
    shrinkPct += 20;
    shiftMinutes += 30;
  } else if (durationHours < 7) {
    shrinkPct += 10;
    shiftMinutes += 15;
  }

  // Low consistency → shrink ~15%
  const consistency = scoreConsistency(recentSleep);
  if (consistency < 60) shrinkPct += 15;
  else if (consistency < 80) shrinkPct += 8;

  // Clarity/stress decline → compress execution, expand recovery
  const clarityTrend = getClarityTrend(recentCheckIns);
  const stressTrend = getStressTrend(recentCheckIns);
  if (clarityTrend < 0 || stressTrend > 0) {
    shrinkPct += 5;
  }

  if (shrinkPct > 0) {
    strategic = shrinkWindow(strategic.start, strategic.end, shrinkPct);
    execution = shrinkWindow(execution.start, execution.end, shrinkPct * 0.8);
  }
  if (shiftMinutes > 0) {
    strategic = shiftEarlier(strategic.start, strategic.end, shiftMinutes);
    execution = shiftEarlier(execution.start, execution.end, shiftMinutes);
    recovery = shiftEarlier(recovery.start, recovery.end, shiftMinutes);
  }

  return { strategic, execution, recovery };
}

function scoreConsistency(records: SleepRecord[]): number {
  if (records.length < 5) return 80;
  const withTimes = records
    .slice(0, 5)
    .filter((r) => r.bedtime && r.wake_time)
    .map((r) => {
      const b = new Date(r.bedtime!).getTime();
      const w = new Date(r.wake_time!).getTime();
      return (b + w) / 2;
    });
  if (withTimes.length < 5) return 80;
  const min = Math.min(...withTimes);
  const max = Math.max(...withTimes);
  const varianceHours = (max - min) / (1000 * 60 * 60);
  if (varianceHours <= 1) return 100;
  if (varianceHours <= 2) return 80;
  if (varianceHours <= 3) return 60;
  return 40;
}

function getClarityTrend(checkIns: CheckIn[]): number {
  if (checkIns.length < 5) return 0;
  const recent = checkIns.slice(0, 3).filter((c) => c.mental_clarity != null);
  const older = checkIns.slice(3, 6).filter((c) => c.mental_clarity != null);
  if (recent.length < 2 || older.length < 2) return 0;
  const recentAvg = recent.reduce((s, c) => s + (c.mental_clarity ?? 0), 0) / recent.length;
  const olderAvg = older.reduce((s, c) => s + (c.mental_clarity ?? 0), 0) / older.length;
  return recentAvg - olderAvg;
}

function getStressTrend(checkIns: CheckIn[]): number {
  if (checkIns.length < 5) return 0;
  const recent = checkIns.slice(0, 3).filter((c) => c.stress_level != null);
  const older = checkIns.slice(3, 6).filter((c) => c.stress_level != null);
  if (recent.length < 2 || older.length < 2) return 0;
  const recentAvg = recent.reduce((s, c) => s + (c.stress_level ?? 0), 0) / recent.length;
  const olderAvg = older.reduce((s, c) => s + (c.stress_level ?? 0), 0) / older.length;
  return recentAvg - olderAvg;
}
