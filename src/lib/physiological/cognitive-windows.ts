/**
 * Module E: Cognitive Window Forecast
 * Predicts time-of-day performance fluctuations from cortisol, sleep pressure, chronotype.
 */

export type CognitiveWindow = { start: string; end: string };

export type CognitiveWindowsResult = {
  deep_work: CognitiveWindow;
  emotional_regulation: CognitiveWindow;
  reaction_time_dip: CognitiveWindow;
  creative_insight: CognitiveWindow;
};

type Chronotype = "early" | "intermediate" | "late";

type SleepRecord = {
  duration_minutes: number | null;
  bedtime: string | null;
  wake_time: string | null;
};

const CHRONO_DEEP_WORK: Record<Chronotype, CognitiveWindow> = {
  early: { start: "08:00", end: "11:00" },
  intermediate: { start: "09:20", end: "11:40" },
  late: { start: "10:00", end: "12:30" },
};

const CHRONO_DIP: Record<Chronotype, CognitiveWindow> = {
  early: { start: "13:30", end: "14:30" },
  intermediate: { start: "14:40", end: "15:30" },
  late: { start: "15:30", end: "16:30" },
};

const CHRONO_CREATIVE: Record<Chronotype, CognitiveWindow> = {
  early: { start: "19:30", end: "21:00" },
  intermediate: { start: "20:30", end: "22:00" },
  late: { start: "21:30", end: "23:00" },
};

const CHRONO_EMOTIONAL: Record<Chronotype, CognitiveWindow> = {
  early: { start: "10:00", end: "12:00" },
  intermediate: { start: "11:00", end: "13:00" },
  late: { start: "12:00", end: "14:00" },
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

function shrinkWindow(start: string, end: string, shrinkPct: number): CognitiveWindow {
  const s = parseTime(start);
  const e = parseTime(end);
  const span = e - s;
  const newSpan = Math.max(45, Math.round(span * (1 - shrinkPct / 100)));
  const shift = Math.round((span - newSpan) / 2);
  return {
    start: formatTime(s + shift),
    end: formatTime(s + shift + newSpan),
  };
}

function shiftWindow(start: string, end: string, minutes: number): CognitiveWindow {
  const s = parseTime(start);
  const e = parseTime(end);
  return {
    start: formatTime(Math.max(0, s + minutes)),
    end: formatTime(Math.min(24 * 60 - 1, e + minutes)),
  };
}

export function computeCognitiveWindows(
  latestSleep: SleepRecord | null,
  recentSleep: SleepRecord[],
  sleepPressurePct: number,
  chronotype: Chronotype = "intermediate"
): CognitiveWindowsResult {
  let deepWork = { ...CHRONO_DEEP_WORK[chronotype] };
  let dip = { ...CHRONO_DIP[chronotype] };
  let creative = { ...CHRONO_CREATIVE[chronotype] };
  let emotional = { ...CHRONO_EMOTIONAL[chronotype] };

  let shrinkPct = 0;
  let shiftMinutes = 0;

  const durationHours = (latestSleep?.duration_minutes ?? 480) / 60;
  if (durationHours < 6) {
    shrinkPct += 20;
    shiftMinutes += 30;
  } else if (durationHours < 7) {
    shrinkPct += 10;
    shiftMinutes += 15;
  }

  if (sleepPressurePct > 15) {
    shrinkPct += Math.min(15, sleepPressurePct / 2);
  }

  const consistency = scoreConsistency(recentSleep);
  if (consistency < 60) shrinkPct += 15;
  else if (consistency < 80) shrinkPct += 8;

  if (shrinkPct > 0) {
    deepWork = shrinkWindow(deepWork.start, deepWork.end, shrinkPct);
    emotional = shrinkWindow(emotional.start, emotional.end, shrinkPct * 0.8);
    creative = shrinkWindow(creative.start, creative.end, shrinkPct * 0.6);
  }
  if (shiftMinutes > 0) {
    deepWork = shiftWindow(deepWork.start, deepWork.end, -shiftMinutes);
    emotional = shiftWindow(emotional.start, emotional.end, -shiftMinutes);
    dip = shiftWindow(dip.start, dip.end, shiftMinutes);
    creative = shiftWindow(creative.start, creative.end, -shiftMinutes);
  }

  return {
    deep_work: deepWork,
    emotional_regulation: emotional,
    reaction_time_dip: dip,
    creative_insight: creative,
  };
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
