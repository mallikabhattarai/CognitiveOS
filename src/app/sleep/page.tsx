import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SleepList } from "./SleepList";
import { LogSleepButton } from "./LogSleepButton";

export default async function SleepPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/sleep");
  }

  const { data: records } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(14);

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
        Sleep log
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Track your sleep for cognitive readiness insights.
      </p>

      <LogSleepButton className="mt-6" />

      <SleepList records={records ?? []} className="mt-8" />
    </main>
  );
}
