import { createBrowserClient } from "@supabase/ssr";

// Publishable ("anon") key only — safe for the browser bundle. Access
// control is enforced by Postgres Row Level Security, not by this key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
