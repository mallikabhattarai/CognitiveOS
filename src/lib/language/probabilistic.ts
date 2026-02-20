/**
 * Probabilistic language enforcement for CognitiveOS v2.
 * All user-facing outputs must use probabilistic phrasing to avoid deterministic claims.
 */

export const PHRASES_ALLOWED = {
  is_likely_to: "is likely to",
  may_experience: "may experience",
  suggests_trend_toward: "suggests a trend toward",
  is_associated_with: "is associated with",
  projected_to: "projected to",
  suggests_increased_likelihood: "suggests increased likelihood",
  trend_toward: "trend toward",
} as const;

export const PHRASES_AVOIDED = [
  "will",
  "guarantees",
  "prevents",
  "ensures",
  "always",
  "never",
  "must",
] as const;

export type ProbabilisticTemplate = keyof typeof PHRASES_ALLOWED;

/**
 * Wraps or formats text using probabilistic phrasing.
 * Use for dynamic copy that needs to convey uncertainty.
 */
export function wrapProbabilistic(
  text: string,
  template: ProbabilisticTemplate = "is_associated_with"
): string {
  const phrase = PHRASES_ALLOWED[template];
  if (text.startsWith(phrase) || text.toLowerCase().includes(phrase)) {
    return text;
  }
  return `${phrase} ${text.toLowerCase()}`;
}

/**
 * Validates that a string does not contain avoided deterministic phrasing.
 * Returns true if safe, false if contains avoided phrases.
 */
export function validateProbabilistic(text: string): boolean {
  const lower = text.toLowerCase();
  return !PHRASES_AVOIDED.some((p) => {
    const regex = new RegExp(`\\b${p}\\b`, "i");
    return regex.test(lower);
  });
}
