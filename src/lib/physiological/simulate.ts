/**
 * Simulation Mode ("What If" Engine)
 * Runs physiological models with hypothetical inputs to project impact.
 */

export type SimulateScenario =
  | "late_dinner"
  | "two_drinks"
  | "red_eye_flight"
  | "screen_90_before_bed"
  | "custom";

export type SimulateInput = {
  scenario: SimulateScenario;
  alcohol_timing?: string; // HH:mm
  bedtime_shift_minutes?: number;
  nap_duration_minutes?: number;
  screen_minutes?: number;
};

export type SimulateResult = {
  rem_suppression_estimate: string;
  sleep_latency_change: string;
  cognitive_window_shift: string;
  summary: string;
};

const SCENARIO_IMPACTS: Record<
  Exclude<SimulateScenario, "custom">,
  SimulateResult
> = {
  late_dinner: {
    rem_suppression_estimate:
      "Late dinner is associated with reduced REM consolidation in the second half of the night.",
    sleep_latency_change:
      "Sleep latency may increase by approximately 15–25 minutes.",
    cognitive_window_shift:
      "Your deep work window may shift later by 20–30 minutes tomorrow.",
    summary:
      "Late dinner is associated with delayed digestion and may impact sleep architecture. Consider eating at least 2–3 hours before bed.",
  },
  two_drinks: {
    rem_suppression_estimate:
      "Alcohol consumption is associated with reduced REM consolidation in the second half of the night.",
    sleep_latency_change:
      "Initial sleep latency may decrease, but sleep fragmentation may increase in the second half of the night.",
    cognitive_window_shift:
      "Cognitive recovery may extend into the following day.",
    summary:
      "Alcohol consumption at night is associated with REM suppression and fragmented sleep. Cognitive recovery may extend into the following day.",
  },
  red_eye_flight: {
    rem_suppression_estimate:
      "Circadian disruption from travel is associated with altered REM timing and reduced consolidation.",
    sleep_latency_change:
      "Sleep latency may be variable; jet lag may extend recovery by 1–2 days per time zone crossed.",
    cognitive_window_shift:
      "Cognitive windows may shift according to destination time zone over 2–4 days.",
    summary:
      "Red-eye flights are associated with significant circadian misalignment. Recovery may take several days depending on time zones crossed.",
  },
  screen_90_before_bed: {
    rem_suppression_estimate:
      "Blue light exposure before bed is associated with delayed melatonin onset and may shift REM later.",
    sleep_latency_change:
      "Sleep latency may increase by approximately 20–40 minutes.",
    cognitive_window_shift:
      "Your morning cognitive peak may shift later by 30–45 minutes.",
    summary:
      "Screen use 90 minutes before bed is associated with delayed sleep onset and shifted circadian timing. Consider a wind-down routine without screens.",
  },
};

export function runSimulation(
  input: SimulateInput,
  baseContext?: { chronotype?: string }
): SimulateResult {
  if (input.scenario !== "custom") {
    return SCENARIO_IMPACTS[input.scenario];
  }

  const parts: string[] = [];

  if (input.alcohol_timing) {
    parts.push(
      `Alcohol consumption at ${input.alcohol_timing} is associated with reduced REM consolidation in the second half of the night.`
    );
  }
  if (input.bedtime_shift_minutes != null && input.bedtime_shift_minutes !== 0) {
    const dir = input.bedtime_shift_minutes > 0 ? "later" : "earlier";
    parts.push(
      `A bedtime shift of ${Math.abs(input.bedtime_shift_minutes)} minutes ${dir} may shift your cognitive windows accordingly.`
    );
  }
  if (input.nap_duration_minutes != null && input.nap_duration_minutes > 0) {
    parts.push(
      `A ${input.nap_duration_minutes}-minute nap may partially offset sleep pressure; avoid napping after 3 PM to protect nighttime sleep.`
    );
  }
  if (input.screen_minutes != null && input.screen_minutes >= 60) {
    parts.push(
      `${input.screen_minutes} minutes of screen use before bed is associated with increased sleep latency and delayed melatonin onset.`
    );
  }

  const rem =
    parts.find((p) => p.includes("REM")) ??
    "Custom scenario impact depends on the combination of factors.";
  const latency =
    parts.find((p) => p.includes("latency") || p.includes("sleep")) ??
    "Sleep architecture may be affected by the selected factors.";
  const window =
    parts.find((p) => p.includes("cognitive") || p.includes("window")) ??
    "Cognitive windows may shift based on the combined inputs.";

  return {
    rem_suppression_estimate: rem,
    sleep_latency_change: latency,
    cognitive_window_shift: window,
    summary: parts.length > 0 ? parts.join(" ") : "Select factors to see projected impact.",
  };
}
