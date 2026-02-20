import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { runPrediction } from "@/lib/prediction/engine";
import { sendPushToUser } from "@/lib/push";
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
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
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
  const { date, sleep_quality, mental_clarity, energy_rating, stress_level } =
    body;

  const today = new Date().toISOString().slice(0, 10);
  const targetDate = date ?? today;

  if (
    sleep_quality !== undefined &&
    (sleep_quality < 1 || sleep_quality > 10)
  ) {
    return NextResponse.json(
      { error: "sleep_quality must be 1–10" },
      { status: 400 }
    );
  }
  if (
    mental_clarity !== undefined &&
    (mental_clarity < 1 || mental_clarity > 10)
  ) {
    return NextResponse.json(
      { error: "mental_clarity must be 1–10" },
      { status: 400 }
    );
  }
  if (
    energy_rating !== undefined &&
    (energy_rating < 1 || energy_rating > 5)
  ) {
    return NextResponse.json(
      { error: "energy_rating must be 1–5" },
      { status: 400 }
    );
  }
  if (stress_level !== undefined && (stress_level < 1 || stress_level > 10)) {
    return NextResponse.json(
      { error: "stress_level must be 1–10" },
      { status: 400 }
    );
  }

  const { error: upsertError } = await supabase
    .from("check_ins")
    .upsert(
      {
        user_id: user.id,
        date: targetDate,
        sleep_quality: sleep_quality ?? null,
        mental_clarity: mental_clarity ?? null,
        energy_rating: energy_rating ?? null,
        stress_level: stress_level ?? null,
      },
      { onConflict: "user_id,date" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Run prediction
  const prediction = await runPrediction(supabase, user.id, targetDate);
  if (prediction) {
    await supabase.from("daily_scores").upsert(
      {
        user_id: user.id,
        date: targetDate,
        edge_score: prediction.edge_score,
      },
      { onConflict: "user_id,date" }
    );
    await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        date: targetDate,
        risk_level: prediction.risk_level,
        risk_horizon_hours: prediction.risk_horizon_hours,
        triggered_rules: prediction.triggered_rules,
        protocol_actions: prediction.protocol_actions,
        readiness_score: prediction.readiness_score,
        edge_score: prediction.edge_score,
        strategic_clarity: prediction.strategic_clarity,
        emotional_regulation: prediction.emotional_regulation,
        cognitive_stamina: prediction.cognitive_stamina,
        peak_windows: prediction.peak_windows,
        drift_status: prediction.drift_status,
        drift_pct_5d: prediction.drift_pct_5d,
        insights: prediction.insights,
        recommendations: prediction.recommendations,
        model_version: prediction.model_version ?? "research_v2",
        circadian_alignment_pct: prediction.circadian_alignment_pct,
        biological_readiness_time: prediction.biological_readiness_time,
        bedtime_vs_brt_minutes: prediction.bedtime_vs_brt_minutes,
        sleep_pressure_pct: prediction.sleep_pressure_pct,
        cognitive_dip_window_start: prediction.cognitive_dip_window?.start ?? null,
        cognitive_dip_window_end: prediction.cognitive_dip_window?.end ?? null,
        recovery_time_estimate: prediction.recovery_time_estimate,
        predicted_n3_pct: prediction.predicted_n3_pct,
        predicted_rem_pct: prediction.predicted_rem_pct,
        fragmentation_risk: prediction.fragmentation_risk,
        predicted_efficiency: prediction.predicted_efficiency,
        cognitive_window_deep_work: prediction.cognitive_windows?.deep_work,
        cognitive_window_dip: prediction.cognitive_windows?.reaction_time_dip,
        cognitive_window_creative: prediction.cognitive_windows?.creative_insight,
        projection_baseline: prediction.projection_72h?.baseline,
        projection_recovery: prediction.projection_72h?.recovery,
        projection_partial: prediction.projection_72h?.partial,
        cognitive_sleep_age: prediction.cognitive_sleep_age,
        sleep_age_driver: prediction.sleep_age_driver,
        edge_breakdown: prediction.edge_breakdown,
      },
      { onConflict: "user_id,date" }
    );

    if (prediction.risk_level !== "low") {
      await sendPushToUser(supabase, user.id, {
        title: "Cognitive capacity alert",
        body: "Your cognitive capacity is trending down in 48–72 hours. Tap to see actions.",
        url: "/home",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
