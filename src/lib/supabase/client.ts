import { createBrowserClient } from "@supabase/ssr";

export function createClient(url?: string, key?: string) {
  const supabaseUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(supabaseUrl, supabaseKey);
}
