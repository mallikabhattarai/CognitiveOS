/**
 * Module F: Cognitive Sleep Age Index
 * Translates sleep quality into a biologically interpretable metric.
 * Disclaimer: This estimate reflects modeled sleep architecture patterns and is not a clinical assessment.
 */

export const SLEEP_AGE_DISCLAIMER =
  "This estimate reflects modeled sleep architecture patterns and is not a clinical assessment.";

export type SleepAgeResult = {
  cognitive_sleep_age: number;
  sleep_age_driver: string;
  chronological_age: number | null;
};

type SleepArchitectureInput = {
  predicted_n3_pct: number;
  predicted_rem_pct: number;
  fragmentation_risk: number;
  predicted_efficiency: number;
};

function getN3AgeNorm(age: number): number {
  if (age < 30) return 22;
  if (age < 40) return 18;
  if (age < 50) return 15;
  return 12;
}

export function computeSleepAge(
  architecture: SleepArchitectureInput,
  age: number | null,
  consistencyScore: number
): SleepAgeResult | null {
  if (age == null) return null;

  const n3Norm = getN3AgeNorm(age);
  const n3Deficit = n3Norm - architecture.predicted_n3_pct;
  const efficiencyDeficit = 90 - architecture.predicted_efficiency;
  const fragExcess = Math.max(0, architecture.fragmentation_risk - 25);
  const variabilityPenalty = Math.max(0, (100 - consistencyScore) / 5);

  let ageAdd = 0;
  let driver = "baseline alignment";

  if (n3Deficit > 3) {
    ageAdd += Math.round(n3Deficit * 1.5);
    driver = "reduced slow-wave sleep preservation";
  }
  if (efficiencyDeficit > 5) {
    const add = Math.round(efficiencyDeficit * 0.4);
    if (add > ageAdd) driver = "lower sleep efficiency";
    ageAdd = Math.max(ageAdd, add);
  }
  if (fragExcess > 15) {
    const add = Math.round(fragExcess * 0.3);
    if (add > ageAdd) driver = "elevated fragmentation risk";
    ageAdd = Math.max(ageAdd, add);
  }
  if (variabilityPenalty > 2) {
    const add = Math.round(variabilityPenalty);
    if (add > ageAdd) driver = "sleep schedule variability";
    ageAdd = Math.max(ageAdd, add);
  }

  const cognitiveAge = Math.max(age, Math.min(age + 15, age + ageAdd));

  return {
    cognitive_sleep_age: cognitiveAge,
    sleep_age_driver: driver,
    chronological_age: age,
  };
}
