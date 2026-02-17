import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { count } = await supabase
    .from("sleep_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) > 0) {
    redirect("/home");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone, chronotype")
    .eq("id", user.id)
    .single();

  return (
    <OnboardingFlow
      initialTimezone={profile?.timezone ?? "UTC"}
      initialChronotype={profile?.chronotype ?? "intermediate"}
      userId={user.id}
    />
  );
}
