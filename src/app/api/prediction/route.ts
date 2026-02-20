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
      ...prediction,
      edge_score: prediction.edge_score ?? prediction.readiness_score,
    });
  }

  return NextResponse.json(null);
}
