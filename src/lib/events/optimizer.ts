/**
 * Event Optimization Mode
 * Computes Performance Target Plan for hitting target Edge Score.
 */

export type EventPlan = {
  sleep_target_minutes: number;
  optimal_bedtime: string;
  recovery_days: number;
};

export function computeEventPlan(
  targetEdgeScore: number,
  daysUntilEvent: number,
  hasUpcomingTravel: boolean
): EventPlan {
  // To hit >=85 Edge Score: sleep 7h45m for next 2 nights
  const sleepTarget = targetEdgeScore >= 85 ? 465 : 450; // 7h45m or 7h30m

  // Optimal bedtime: assume 7.5h sleep, wake at 7am → 11:30pm
  const optimalHour = 23;
  const optimalMin = 30;
  const optimalBedtime = `${optimalHour.toString().padStart(2, "0")}:${optimalMin.toString().padStart(2, "0")}`;

  // Recovery days: +1 if travel within 48h
  const recoveryDays = hasUpcomingTravel ? 1 : 0;

  return {
    sleep_target_minutes: sleepTarget,
    optimal_bedtime: optimalBedtime,
    recovery_days: recoveryDays,
  };
}

export const EVENT_TYPES = [
  { value: "board_meeting", label: "Board meeting" },
  { value: "fundraise", label: "Fundraise" },
  { value: "earnings_call", label: "Earnings call" },
  { value: "product_launch", label: "Product launch" },
  { value: "court_case", label: "Court case" },
  { value: "conference", label: "Conference" },
  { value: "custom", label: "Custom" },
] as const;
