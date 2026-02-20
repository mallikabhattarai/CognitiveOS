/**
 * Module A: Homeostatic Sleep Pressure Model (Adenosine Simulation)
 * Sleep pressure increases linearly during wake, decreases exponentially during sleep.
 */

export type SleepPressureResult = {
  sleep_pressure_pct: number;
  cognitive_dip_window: { start: string; end: string };
  recovery_time_estimate: number; // hours
};

type SleepRecord = {
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  nap_duration_minutes?: number | null;
  caffeine_after_2pm?: boolean | null;
};

const PRESSURE_RATE_WAKE = 1; // units per hour awake
const PRESSURE_DECAY_TAU = 4.5; // hours (exponential decay during sleep)
const TARGET_SLEEP_HOURS = 7.5;

function parseTimeToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function formatTimeFromMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getHoursBetween(wakeIso: string, bedIso: string): number {
  const wake = new Date(wakeIso).getTime();
  const bed = new Date(bedIso).getTime();
  return Math.max(0, (bed - wake) / (1000 * 60 * 60));
}

export function computeSleepPressure(
  recentSleep: SleepRecord[]
): SleepPressureResult | null {
  if (recentSleep.length < 2) return null;

  const sorted = [...recentSleep].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const lastNight = sorted[0];
  const prevNight = sorted[1];

  if (!lastNight.bedtime) return null;

  const durationHours = (lastNight.duration_minutes ?? 420) / 60;
  const napHours = (lastNight.nap_duration_minutes ?? 0) / 60;
  const prevWake = prevNight?.wake_time ?? (() => {
    const bed = new Date(lastNight.bedtime!);
    bed.setHours(bed.getHours() - 16, bed.getMinutes(), 0, 0);
    return bed.toISOString();
  })();
  const wakeHours = getHoursBetween(prevWake, lastNight.bedtime);

  let pressureAtBed = wakeHours * PRESSURE_RATE_WAKE;
  if (lastNight.caffeine_after_2pm) pressureAtBed *= 1.15;

  const dissipated =
    pressureAtBed * (1 - Math.exp(-durationHours / PRESSURE_DECAY_TAU));
  const residualPressure = pressureAtBed - dissipated + napHours * 0.3;

  const baselineDissipated = TARGET_SLEEP_HOURS * 0.7;
  const baselinePressure = 16 * PRESSURE_RATE_WAKE - baselineDissipated;
  const pressurePct =
    baselinePressure > 0
      ? Math.max(0, ((residualPressure - baselinePressure) / baselinePressure) * 100)
      : 0;

  const dipStartMinutes = 14 * 60 + 30;
  const dipEndMinutes = 16 * 60;
  if (pressurePct > 15) {
    const extend = Math.min(60, Math.round(pressurePct / 3));
    return {
      sleep_pressure_pct: Math.round(Math.min(50, pressurePct)),
      cognitive_dip_window: {
        start: formatTimeFromMinutes(dipStartMinutes),
        end: formatTimeFromMinutes(dipEndMinutes + extend),
      },
      recovery_time_estimate: Math.min(24, Math.round(4 + pressurePct / 10)),
    };
  }

  return {
    sleep_pressure_pct: Math.round(pressurePct),
    cognitive_dip_window: {
      start: formatTimeFromMinutes(dipStartMinutes),
      end: formatTimeFromMinutes(dipEndMinutes),
    },
    recovery_time_estimate: Math.max(0, Math.round(2 + pressurePct / 15)),
  };
}
