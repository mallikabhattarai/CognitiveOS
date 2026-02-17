import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { computeEventPlan } from "@/lib/events/optimizer";

export async function GET() {
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

  const { data: events } = await supabase
    .from("optimization_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("target_date", new Date().toISOString().slice(0, 10))
    .order("target_date", { ascending: true });

  return NextResponse.json(events ?? []);
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
  const { event_type, event_label, target_date, target_edge_score } = body;

  const validTypes = [
    "board_meeting",
    "fundraise",
    "earnings_call",
    "product_launch",
    "court_case",
    "conference",
    "custom",
  ];
  if (!event_type || !validTypes.includes(event_type)) {
    return NextResponse.json(
      { error: "event_type must be one of: " + validTypes.join(", ") },
      { status: 400 }
    );
  }
  if (!target_date || typeof target_date !== "string") {
    return NextResponse.json({ error: "target_date required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const target = new Date(target_date);
  const todayDate = new Date(today);
  const daysUntil = Math.ceil((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  // TODO: check for upcoming travel within 48h of event
  const hasUpcomingTravel = false;

  const plan = computeEventPlan(
    target_edge_score ?? 85,
    Math.max(0, daysUntil),
    hasUpcomingTravel
  );

  const { data, error } = await supabase
    .from("optimization_events")
    .insert({
      user_id: user.id,
      event_type,
      event_label: event_label ?? null,
      target_date,
      target_edge_score: target_edge_score ?? 85,
      sleep_target_minutes: plan.sleep_target_minutes,
      optimal_bedtime: plan.optimal_bedtime,
      recovery_days: plan.recovery_days,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    plan: {
      sleep_target_minutes: plan.sleep_target_minutes,
      sleep_target_display: `${Math.floor(plan.sleep_target_minutes / 60)}h ${plan.sleep_target_minutes % 60}m`,
      optimal_bedtime: plan.optimal_bedtime,
      recovery_days: plan.recovery_days,
    },
  });
}
