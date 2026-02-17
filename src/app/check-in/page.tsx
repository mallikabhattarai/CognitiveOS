import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckInForm } from "./CheckInForm";

export default async function CheckInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/check-in");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="flex min-h-screen flex-col p-6">
      <h1 className="text-xl font-medium tracking-tight text-text-primary">
        Daily check-in
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        How did you sleep? How&apos;s your mental clarity?
      </p>

      <CheckInForm date={today} />
    </main>
  );
}
