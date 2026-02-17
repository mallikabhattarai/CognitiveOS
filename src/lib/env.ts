import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnvLocal(): Record<string, string> {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
  try {
    const content = readFileSync(envPath, "utf-8");
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          result[key] = value;
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const isPlaceholder = url.includes("your-project") || !url;
  if (url && key && !isPlaceholder) return { url, key };
  const local = loadEnvLocal();
  return {
    url: local.NEXT_PUBLIC_SUPABASE_URL ?? url,
    key: local.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? key,
  };
}
