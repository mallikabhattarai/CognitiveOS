import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { EventsClient } from "./EventsClient";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/events");
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
        Event Optimization
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Get a Performance Target Plan for your big events.
      </p>

      <EventsClient className="mt-6" />
    </main>
  );
}
