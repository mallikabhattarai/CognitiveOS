import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { InsightsClient } from "./InsightsClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/insights");
  }

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
        Insights
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Sleep trends and patterns over time.
      </p>

      <InsightsClient className="mt-6" />
    </main>
  );
}
