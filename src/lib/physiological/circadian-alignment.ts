/**
 * Module B: Circadian Alignment Score
 * Estimates alignment between biological night and chosen sleep schedule.
 * BRT = Estimated DLMO + 60–90 minutes (midpoint 75 min).
 */

export type CircadianAlignmentResult = {
  biological_readiness_time: string; // HH:mm
  circadian_alignment_pct: number;
  bedtime_vs_brt_minutes: number; // signed: negative = earlier than BRT
  interpretation: "high" | "moderate" | "misaligned";
  avg_bedtime_7d: string | null;
};

type SleepRecord = {
  bedtime: string | null;
  wake_time: string | null;
};

type Chronotype = "early" | "intermediate" | "late";

const DLMO_OFFSET_HOURS = 2.5; // DLMO typically ~2–3h before habitual sleep
const BRT_OFFSET_MINUTES = 75; // midpoint of 60–90 min after DLMO

function parseTimeToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function formatTimeFromMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getChronotypeOffset(chronotype: Chronotype): number {
  switch (chronotype) {
    case "early":
      return -30; // earlier DLMO
    case "late":
      return 30; // later DLMO
    default:
      return 0;
  }
}

export function computeCircadianAlignment(
  recentSleep: SleepRecord[],
  tonightBedtime: string | null,
  chronotype: Chronotype = "intermediate"
): CircadianAlignmentResult | null {
  const withBedtime = recentSleep
    .filter((r) => r.bedtime)
    .slice(0, 7);
  if (withBedtime.length < 3) return null;

  const bedtimesMinutes = withBedtime.map((r) =>
    parseTimeToMinutes(r.bedtime!)
  );
  const avgBedtimeMinutes =
    bedtimesMinutes.reduce((a, b) => a + b, 0) / bedtimesMinutes.length;

  const chronoOffset = getChronotypeOffset(chronotype);
  const dlmoMinutes = avgBedtimeMinutes - DLMO_OFFSET_HOURS * 60 + chronoOffset;
  const brtMinutes =
    (dlmoMinutes + BRT_OFFSET_MINUTES + 24 * 60) % (24 * 60);

  const avgBedtimeStr = formatTimeFromMinutes(avgBedtimeMinutes);
  const brtStr = formatTimeFromMinutes(brtMinutes);

  let bedtimeVsBrt = 0;
  if (tonightBedtime) {
    const tonightMinutes = parseTimeToMinutes(tonightBedtime);
    bedtimeVsBrt = tonightMinutes - brtMinutes;
    if (Math.abs(bedtimeVsBrt) > 12 * 60) {
      bedtimeVsBrt = bedtimeVsBrt > 0 ? bedtimeVsBrt - 24 * 60 : bedtimeVsBrt + 24 * 60;
    }
  } else {
    bedtimeVsBrt = avgBedtimeMinutes - brtMinutes;
    if (Math.abs(bedtimeVsBrt) > 12 * 60) {
      bedtimeVsBrt = bedtimeVsBrt > 0 ? bedtimeVsBrt - 24 * 60 : bedtimeVsBrt + 24 * 60;
    }
  }

  const absDiff = Math.abs(bedtimeVsBrt);
  let interpretation: "high" | "moderate" | "misaligned" = "misaligned";
  if (absDiff <= 15) interpretation = "high";
  else if (absDiff <= 45) interpretation = "moderate";

  const alignmentPct = Math.max(0, Math.min(100, 100 - absDiff * 2));

  return {
    biological_readiness_time: brtStr,
    circadian_alignment_pct: Math.round(alignmentPct),
    bedtime_vs_brt_minutes: Math.round(bedtimeVsBrt),
    interpretation,
    avg_bedtime_7d: avgBedtimeStr,
  };
}
