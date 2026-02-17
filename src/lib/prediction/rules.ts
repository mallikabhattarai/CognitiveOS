type SleepRecord = {
  date: string;
  duration_minutes: number | null;
  quality_rating: number | null;
  bedtime: string | null;
  wake_time: string | null;
};

type CheckIn = {
  date: string;
  mental_clarity: number | null;
};

export function shortSleep3Nights(records: SleepRecord[]): boolean {
  const last5 = records.slice(0, 5);
  const short = last5.filter((r) => r.duration_minutes !== null && r.duration_minutes < 360);
  return short.length >= 3;
}

export function chronicShortSleep(records: SleepRecord[]): boolean {
  const last7 = records.slice(0, 7);
  const short = last7.filter((r) => r.duration_minutes !== null && r.duration_minutes < 420);
  return short.length >= 5;
}

export function sleepMidpointShift(records: SleepRecord[]): boolean {
  if (records.length < 5) return false;
  const last5 = records.slice(0, 5);
  const midpoints = last5
    .filter((r) => r.bedtime && r.wake_time)
    .map((r) => {
      const b = new Date(r.bedtime!).getTime();
      const w = new Date(r.wake_time!).getTime();
      return (b + w) / 2;
    });
  if (midpoints.length < 5) return false;
  const min = Math.min(...midpoints);
  const max = Math.max(...midpoints);
  return (max - min) / (1000 * 60 * 60) > 2;
}

export function lowQuality3Nights(records: SleepRecord[]): boolean {
  const last5 = records.slice(0, 5);
  const low = last5.filter((r) => r.quality_rating !== null && r.quality_rating <= 3);
  return low.length >= 3;
}

export function clarityDrop(checkIns: CheckIn[]): boolean {
  if (checkIns.length < 7) return false;
  const today = checkIns[0];
  if (today.mental_clarity === null) return false;
  const prev7 = checkIns.slice(1, 8);
  const valid = prev7.filter((c) => c.mental_clarity !== null);
  if (valid.length < 5) return false;
  const avg = valid.reduce((s, c) => s + (c.mental_clarity ?? 0), 0) / valid.length;
  return today.mental_clarity <= avg - 2;
}

export function evaluateRules(
  sleepRecords: SleepRecord[],
  checkIns: CheckIn[]
): string[] {
  const triggered: string[] = [];
  if (shortSleep3Nights(sleepRecords)) triggered.push("short_sleep_3_nights");
  if (chronicShortSleep(sleepRecords)) triggered.push("chronic_short_sleep");
  if (sleepMidpointShift(sleepRecords)) triggered.push("sleep_midpoint_shift");
  if (lowQuality3Nights(sleepRecords)) triggered.push("low_quality_3_nights");
  if (clarityDrop(checkIns)) triggered.push("clarity_drop");
  return triggered;
}
