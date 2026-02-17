import { SignupForm } from "./SignupForm";
import { getSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

  return <SignupForm supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />;
}
