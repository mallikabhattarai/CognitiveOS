import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SimulateClient } from "./SimulateClient";

export const dynamic = "force-dynamic";

export default async function SimulatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/simulate");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("chronotype")
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
        What If
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        See how behaviors may affect your sleep and cognitive performance.
      </p>

      <SimulateClient
        className="mt-6"
        chronotype={(profile?.chronotype as string) ?? "intermediate"}
      />
    </main>
  );
}
