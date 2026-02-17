/**
 * Flight & Travel Intelligence
 * Computes time zone shift, circadian disruption, recovery days, and day-by-day impact.
 */

export type TravelImpact = {
  timezoneShiftHours: number;
  circadianRisk: "low" | "moderate" | "high";
  recoveryDays: number;
  dayImpacts: { dayOffset: number; strategicClarityDeltaPct: number; notes: string }[];
  recommendations: {
    lightExposure: string;
    caffeineTiming: string;
    napTiming: string;
    bedtimeShift: string;
  };
};

const CITY_TZ: Record<string, string> = {
  "San Francisco": "America/Los_Angeles",
  SF: "America/Los_Angeles",
  "Los Angeles": "America/Los_Angeles",
  "New York": "America/New_York",
  NYC: "America/New_York",
  London: "Europe/London",
  Paris: "Europe/Paris",
  Berlin: "Europe/Berlin",
  Tokyo: "Asia/Tokyo",
  "Hong Kong": "Asia/Hong_Kong",
  Singapore: "Asia/Singapore",
  Sydney: "Australia/Sydney",
  Dubai: "Asia/Dubai",
  Mumbai: "Asia/Kolkata",
  "Shanghai": "Asia/Shanghai",
};

function getOffsetMinutes(tz: string, date: Date): number {
  try {
    const tzHour = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(date),
      10
    );
    const tzMin = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, minute: "numeric" }).format(date),
      10
    );
    const utcHour = date.getUTCHours();
    const utcMin = date.getUTCMinutes();
    let diff = (tzHour * 60 + tzMin) - (utcHour * 60 + utcMin);
    if (diff > 12 * 60) diff -= 24 * 60;
    if (diff < -12 * 60) diff += 24 * 60;
    return diff;
  } catch {
    return 0;
  }
}

export function computeTravelImpact(
  departureTz: string,
  arrivalTz: string,
  departureDatetime: Date,
  arrivalDatetime: Date
): TravelImpact {
  const depOffset = getOffsetMinutes(departureTz, departureDatetime);
  const arrOffset = getOffsetMinutes(arrivalTz, arrivalDatetime);
  const shiftMinutes = arrOffset - depOffset;
  const timezoneShiftHours = Math.round(shiftMinutes / 60);

  let circadianRisk: "low" | "moderate" | "high" = "low";
  if (Math.abs(timezoneShiftHours) >= 6) circadianRisk = "high";
  else if (Math.abs(timezoneShiftHours) >= 3) circadianRisk = "moderate";

  const recoveryDays = Math.max(1, Math.ceil(Math.abs(timezoneShiftHours) / 2));

  const dayImpacts: { dayOffset: number; strategicClarityDeltaPct: number; notes: string }[] = [];
  for (let d = 0; d <= recoveryDays; d++) {
    const pct = d === 0 ? -15 - Math.abs(timezoneShiftHours) * 0.5 : -10 + d * 5;
    const notes =
      d === 0
        ? "Arrival day – expect compression"
        : d === 1
          ? "Compression window likely mid-afternoon"
          : d === recoveryDays
            ? "Full recovery expected"
            : "Gradual recovery";
    dayImpacts.push({
      dayOffset: d,
      strategicClarityDeltaPct: Math.round(pct),
      notes,
    });
  }

  return {
    timezoneShiftHours,
    circadianRisk,
    recoveryDays,
    dayImpacts,
    recommendations: {
      lightExposure: "Get morning light at destination within 1h of local sunrise",
      caffeineTiming: "Avoid caffeine after 2pm local; use strategically in first 2 days",
      napTiming: "20-min nap before 3pm local if needed",
      bedtimeShift: "Gradually shift bedtime 30–60min per night 2–3 nights before flight",
    },
  };
}

export function resolveCityToTz(city: string): string {
  const normalized = city.trim();
  return CITY_TZ[normalized] ?? CITY_TZ[normalized.replace(/\s+/g, " ")] ?? "UTC";
}
