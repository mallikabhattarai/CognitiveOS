import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { computeTravelImpact } from "@/lib/travel/impact";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const { data: trip, error } = await supabase
    .from("travel_trips")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const impact = computeTravelImpact(
    trip.departure_tz,
    trip.arrival_tz,
    new Date(trip.departure_datetime),
    new Date(trip.arrival_datetime)
  );

  return NextResponse.json(impact);
}
