import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { computeTravelImpact, resolveCityToTz } from "@/lib/travel/impact";

const COMMON_TZ = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

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

  const { data: trips } = await supabase
    .from("travel_trips")
    .select("*")
    .eq("user_id", user.id)
    .order("departure_datetime", { ascending: false })
    .limit(20);

  return NextResponse.json(trips ?? []);
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
    departure_city,
    departure_tz,
    arrival_city,
    arrival_tz,
    departure_datetime,
    arrival_datetime,
  } = body;

  if (!departure_city || !arrival_city) {
    return NextResponse.json(
      { error: "departure_city and arrival_city required" },
      { status: 400 }
    );
  }
  if (!departure_datetime || !arrival_datetime) {
    return NextResponse.json(
      { error: "departure_datetime and arrival_datetime required" },
      { status: 400 }
    );
  }

  const depTz = departure_tz ?? resolveCityToTz(departure_city);
  const arrTz = arrival_tz ?? resolveCityToTz(arrival_city);

  const depDate = new Date(departure_datetime);
  const arrDate = new Date(arrival_datetime);

  const impact = computeTravelImpact(depTz, arrTz, depDate, arrDate);

  const { data, error } = await supabase
    .from("travel_trips")
    .insert({
      user_id: user.id,
      departure_city,
      departure_tz: depTz,
      arrival_city,
      arrival_tz: arrTz,
      departure_datetime: departure_datetime,
      arrival_datetime: arrival_datetime,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    impact,
  });
}
