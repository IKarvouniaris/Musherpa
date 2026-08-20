"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Lets someone use the app fully (create/save songs) without a password —
// Supabase issues a real auth.uid() for the session, so every RLS policy
// keeps working exactly as it does for a registered user. The account can
// be upgraded to a permanent one later (see app/signup/actions.ts) without
// losing anything, since the user id doesn't change.
export async function continueAsGuest() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    redirect("/login?guestError=1");
  }

  redirect("/songs");
}
