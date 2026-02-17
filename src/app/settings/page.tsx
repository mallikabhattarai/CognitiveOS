import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone, chronotype")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/home"
          className="text-sm text-text-muted transition-colors hover:text-accent"
        >
          ← Home
        </Link>
      </header>

      <h1 className="mt-6 text-xl font-medium tracking-tight text-text-primary">
        Settings
      </h1>

      <SettingsForm
        email={user.email ?? ""}
        timezone={profile?.timezone ?? "UTC"}
        chronotype={profile?.chronotype ?? "intermediate"}
      />
    </main>
  );
}
