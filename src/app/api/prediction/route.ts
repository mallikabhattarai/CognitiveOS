import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { runPrediction } from "@/lib/prediction/engine";

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
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json({
      ...data,
      edge_score: data.edge_score ?? data.readiness_score,
      drift_status: data.drift_status ?? null,
      drift_pct_5d: data.drift_pct_5d ?? null,
    });
  }

  const prediction = await runPrediction(supabase, user.id, date);
  if (prediction) {
    return NextResponse.json({
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
    });
  }

  return NextResponse.json(null);
}
