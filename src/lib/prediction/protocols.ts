const PROTOCOL_MAP: Record<
  string,
  { text: string; secondary?: string }
> = {
  short_sleep_3_nights: {
    text: "Protect sleep tonight — aim for 7+ hours",
    secondary: "Block 9–11 AM for deep work",
  },
  chronic_short_sleep: {
    text: "Recovery: prioritize sleep for 2–3 nights",
    secondary: "Reduce meeting load; defer non-urgent decisions",
  },
  sleep_midpoint_shift: {
    text: "Stabilize bedtime and wake time",
    secondary: "Avoid caffeine after 2 PM",
  },
  low_quality_3_nights: {
    text: "Wind-down: reduce screens 1h before bed",
    secondary: "Consider earlier bedtime",
  },
  clarity_drop: {
    text: "Light cognitive load today",
    secondary: "Protect tonight's sleep",
  },
};

export function getProtocolActions(
  triggeredRules: string[],
  riskLevel: "low" | "elevated" | "high"
): { type: string; text: string }[] {
  const seen = new Set<string>();
  const actions: { type: string; text: string }[] = [];

  for (const rule of triggeredRules) {
    const protocol = PROTOCOL_MAP[rule];
    if (!protocol || seen.has(protocol.text)) continue;
    seen.add(protocol.text);
    actions.push({ type: rule, text: protocol.text });
    if (actions.length >= 3) break;
  }

  if (riskLevel === "high" && actions.length < 3) {
    for (const rule of triggeredRules) {
      const protocol = PROTOCOL_MAP[rule];
      if (!protocol?.secondary || seen.has(protocol.secondary)) continue;
      seen.add(protocol.secondary);
      actions.push({ type: `${rule}_secondary`, text: protocol.secondary });
      if (actions.length >= 3) break;
    }
  }

  return actions;
}

const WIND_DOWN_TIPS = [
  "Reduce screens 1h before bed",
  "Try 4-7-8 breathing before sleep",
  "Dim lights 30min before bed",
  "Avoid caffeine after 2 PM",
  "Keep bedroom cool (65–68°F)",
];

export function getRecommendations(
  sleepRecords: {
    date: string;
    duration_minutes: number | null;
    wake_time: string | null;
  }[],
  sleepDebtMinutes: number
): {
  optimal_bedtime: string | null;
  nap_suggestion: string | null;
  wind_down_tip: string;
} {
  const latest = sleepRecords[0];
  let optimal_bedtime: string | null = null;
  if (latest?.wake_time) {
    const wake = new Date(latest.wake_time);
    const target = new Date(wake);
    target.setHours(target.getHours() - 7, target.getMinutes() - 30, 0, 0);
    optimal_bedtime = target.toTimeString().slice(0, 5);
  }

  let nap_suggestion: string | null = null;
  if (sleepDebtMinutes > 60) {
    nap_suggestion = "20-min nap before 3pm";
  }

  const dayOfYear = new Date().getTime() / (1000 * 60 * 60 * 24);
  const tipIndex = Math.floor(dayOfYear % WIND_DOWN_TIPS.length);
  const wind_down_tip = WIND_DOWN_TIPS[tipIndex];

  return { optimal_bedtime, nap_suggestion, wind_down_tip };
}
