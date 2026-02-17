import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TravelClient } from "./TravelClient";

export const dynamic = "force-dynamic";

export default async function TravelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/travel");
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
        Travel Intelligence
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        See projected cognitive impact and recovery for your trips.
      </p>

      <TravelClient className="mt-6" />
    </main>
  );
}
