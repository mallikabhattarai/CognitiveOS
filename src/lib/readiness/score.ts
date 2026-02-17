/**
 * Cognitive Edge Score 0–100 (formerly readiness).
 * Weighted: duration 30%, quality 25%, consistency 20%, behavioral 15%, energy 10%.
 * Sub-components: Strategic Clarity, Emotional Regulation, Cognitive Stamina.
 */

export type EdgeComponentLabel = "Strong" | "Moderate" | "Slightly Reduced" | "Reduced";

export type EdgeScoreResult = {
  edge_score: number;
  strategic_clarity: EdgeComponentLabel;
  emotional_regulation: EdgeComponentLabel;
  cognitive_stamina: EdgeComponentLabel;
};

type SleepInput = {
  duration_minutes: number | null;
  quality_rating: number | null;
  bedtime: string | null;
  wake_time: string | null;
  caffeine_after_2pm?: boolean | null;
  alcohol_tonight?: boolean | null;
  screen_time_minutes?: number | null;
  exercise_today?: boolean | null;
};

type CheckInInput = {
  mental_clarity?: number | null;
  energy_rating?: number | null;
  stress_level?: number | null;
};

function scoreToLabel(score: number): EdgeComponentLabel {
  if (score >= 80) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Slightly Reduced";
  return "Reduced";
}

export function computeReadinessScore(
  latestSleep: SleepInput | null,
  recentSleep: SleepInput[],
  todayCheckIn: CheckInInput | null
): number {
  return computeEdgeScore(latestSleep, recentSleep, todayCheckIn).edge_score;
}

export function computeEdgeScore(
  latestSleep: SleepInput | null,
  recentSleep: SleepInput[],
  todayCheckIn: CheckInInput | null
): EdgeScoreResult {
  const durationScore = scoreDuration(latestSleep?.duration_minutes ?? null);
  const qualityScore = scoreQuality(latestSleep?.quality_rating ?? null);
  const consistencyScore = scoreConsistency(recentSleep);
  const behavioralScore = scoreBehavioral(latestSleep);
  const energyScore = scoreEnergy(todayCheckIn);

  const weights = { duration: 0.3, quality: 0.25, consistency: 0.2, behavioral: 0.15, energy: 0.1 };
  const total =
    durationScore * weights.duration +
    qualityScore * weights.quality +
    consistencyScore * weights.consistency +
    behavioralScore * weights.behavioral +
    energyScore * weights.energy;

  const edge_score = Math.round(Math.max(0, Math.min(100, total)));

  // Sub-components
  const strategicClarityRaw =
    (scoreMentalClarity(todayCheckIn) * 0.4 +
      qualityScore * 0.35 +
      consistencyScore * 0.25);
  const emotionalRegulationRaw =
    (scoreStressInverted(todayCheckIn) * 0.35 +
      qualityScore * 0.35 +
      energyScore * 0.3);
  const cognitiveStaminaRaw =
    (durationScore * 0.4 +
      energyScore * 0.3 +
      scoreSleepDebtInverted(recentSleep) * 0.3);

  return {
    edge_score,
    strategic_clarity: scoreToLabel(strategicClarityRaw),
    emotional_regulation: scoreToLabel(emotionalRegulationRaw),
    cognitive_stamina: scoreToLabel(cognitiveStaminaRaw),
  };
}

function scoreMentalClarity(checkIn: CheckInInput | null): number {
  if (!checkIn?.mental_clarity) return 60;
  return ((checkIn.mental_clarity - 1) / 9) * 100;
}

function scoreStressInverted(checkIn: CheckInInput | null): number {
  if (!checkIn?.stress_level) return 70;
  return ((10 - checkIn.stress_level) / 9) * 100;
}

function scoreSleepDebtInverted(records: SleepInput[]): number {
  const targetMinutes = 450;
  let debt = 0;
  for (const r of records.slice(0, 5)) {
    if (r.duration_minutes != null && r.duration_minutes < targetMinutes) {
      debt += targetMinutes - r.duration_minutes;
    }
  }
  if (debt === 0) return 100;
  const maxDebt = 5 * (targetMinutes - 240);
  return Math.max(0, 100 - (debt / maxDebt) * 100);
}

function scoreDuration(minutes: number | null): number {
  if (minutes === null) return 50;
  const hours = minutes / 60;
  if (hours >= 7 && hours <= 9) return 100;
  if (hours >= 6 && hours < 7) return 75;
  if (hours >= 5 && hours < 6) return 50;
  if (hours >= 4 && hours < 5) return 30;
  if (hours < 4) return 15;
  if (hours > 9 && hours <= 10) return 85;
  return 60;
}

function scoreQuality(rating: number | null): number {
  if (rating === null) return 60;
  return ((rating - 1) / 4) * 100;
}

function scoreConsistency(records: SleepInput[]): number {
  if (records.length < 5) return 70;
  const withTimes = records
    .slice(0, 5)
    .filter((r) => r.bedtime && r.wake_time)
    .map((r) => {
      const b = new Date(r.bedtime!).getTime();
      const w = new Date(r.wake_time!).getTime();
      return (b + w) / 2;
    });
  if (withTimes.length < 5) return 70;
  const min = Math.min(...withTimes);
  const max = Math.max(...withTimes);
  const varianceHours = (max - min) / (1000 * 60 * 60);
  if (varianceHours <= 1) return 100;
  if (varianceHours <= 2) return 80;
  if (varianceHours <= 3) return 60;
  return 40;
}

function scoreBehavioral(sleep: SleepInput | null): number {
  if (!sleep) return 70;
  let score = 100;
  if (sleep.caffeine_after_2pm) score -= 15;
  if (sleep.alcohol_tonight) score -= 20;
  if (sleep.screen_time_minutes != null) {
    if (sleep.screen_time_minutes >= 90) score -= 25;
    else if (sleep.screen_time_minutes >= 60) score -= 15;
    else if (sleep.screen_time_minutes >= 30) score -= 5;
  }
  if (sleep.exercise_today) score += 5;
  return Math.max(0, Math.min(100, score));
}

function scoreEnergy(checkIn: CheckInInput | null): number {
  if (!checkIn?.energy_rating) return 60;
  return ((checkIn.energy_rating - 1) / 4) * 100;
}
