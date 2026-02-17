import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { computeSleepDebt } from "@/lib/prediction/insights";
import { computeDailyScores, computeDrift } from "@/lib/drift/tracker";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(user.id).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseInt(searchParams.get("range") ?? "14", 10);
  const limit = Math.min(Math.max(range, 7), 30);

  const { data: sleepRecords } = await supabase
    .from("sleep_records")
    .select("date, duration_minutes, quality_rating, bedtime, wake_time, caffeine_after_2pm, alcohol_tonight, screen_time_minutes, exercise_today")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("date, sleep_quality, mental_clarity, energy_rating, stress_level")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  const reversedSleep = [...(sleepRecords ?? [])].reverse();
  const sleepDebt = computeSleepDebt(reversedSleep);
  const targetMinutes = 450;
  let runningDebt = 0;
  const sleepDebtByDate: { date: string; debt: number }[] = [];
  for (const r of reversedSleep) {
    if (r.duration_minutes != null && r.duration_minutes < targetMinutes) {
      runningDebt += targetMinutes - r.duration_minutes;
    }
    sleepDebtByDate.push({ date: r.date, debt: runningDebt });
  }

  const dailyScores = computeDailyScores(sleepRecords ?? [], checkIns ?? []);
  const drift = computeDrift(dailyScores);

  return NextResponse.json({
    sleep: sleepRecords ?? [],
    checkIns: checkIns ?? [],
    sleepDebtMinutes: sleepDebt,
    sleepDebtByDate,
    dailyScores,
    drift: drift ? { status: drift.status, drift_pct_5d: drift.drift_pct_5d, drift_pct_14d: drift.drift_pct_14d } : null,
  });
}
