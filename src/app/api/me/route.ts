import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone, chronotype")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("sleep_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const needsOnboarding = (count ?? 0) === 0;

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile ?? { timezone: "UTC" },
    needsOnboarding,
  });
}

export async function PATCH(request: NextRequest) {
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
  const { timezone, chronotype } = body;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (timezone != null && typeof timezone === "string") {
    updates.timezone = timezone.slice(0, 50);
  }
  if (chronotype != null && typeof chronotype === "string") {
    if (!["early", "intermediate", "late"].includes(chronotype)) {
      return NextResponse.json({ error: "chronotype must be early, intermediate, or late" }, { status: 400 });
    }
    updates.chronotype = chronotype;
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "timezone or chronotype required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
