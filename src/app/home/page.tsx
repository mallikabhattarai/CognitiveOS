import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/home");
  }

  const { count } = await supabase
    .from("sleep_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) === 0) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <header className="border-b border-[var(--border-subtle)] pb-4">
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          CognitiveOS
        </h1>
      </header>

      <HomeClient userId={user.id} />
    </main>
  );
}
