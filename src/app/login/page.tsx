import { LoginForm } from "./LoginForm";
import { getSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

  return <LoginForm supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />;
}
