import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

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
  const limit = parseInt(searchParams.get("limit") ?? "14", 10);

  const { data, error } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const {
    date,
    bedtime,
    wake_time,
    duration_minutes,
    quality_rating,
    caffeine_after_2pm,
    alcohol_tonight,
    screen_time_minutes,
    exercise_today,
  } = body;

  if (!date) {
    return NextResponse.json(
      { error: "date is required" },
      { status: 400 }
    );
  }

  let duration = duration_minutes;
  if (bedtime && wake_time) {
    const b = new Date(bedtime).getTime();
    const w = new Date(wake_time).getTime();
    duration = Math.round((w - b) / 60000);
  }

  if (duration !== undefined && (duration < 120 || duration > 840)) {
    return NextResponse.json(
      { error: "Duration must be between 2 and 14 hours" },
      { status: 400 }
    );
  }

  if (
    screen_time_minutes !== undefined &&
    (screen_time_minutes < 0 || screen_time_minutes > 180)
  ) {
    return NextResponse.json(
      { error: "screen_time_minutes must be 0–180" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sleep_records")
    .upsert(
      {
        user_id: user.id,
        date,
        bedtime: bedtime || null,
        wake_time: wake_time || null,
        duration_minutes: duration ?? null,
        quality_rating: quality_rating ?? null,
        caffeine_after_2pm: caffeine_after_2pm ?? null,
        alcohol_tonight: alcohol_tonight ?? null,
        screen_time_minutes: screen_time_minutes ?? null,
        exercise_today: exercise_today ?? null,
        source: "manual",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
