"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSongSchema } from "@/lib/validation/song";

export async function createSong(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = createSongSchema.safeParse({
    title: formData.get("title"),
    keyLabel: formData.get("keyLabel") ?? undefined,
    bpm: formData.get("bpm") || undefined,
  });

  if (!parsed.success) {
    redirect("/songs/new?error=1");
  }

  // user_id always comes from the authenticated session, never from the
  // submitted form — RLS would reject a mismatched value anyway, but this
  // way a malformed/tampered request can't even try.
  const { error } = await supabase.from("songs").insert({
    user_id: user.id,
    title: parsed.data.title,
    key_label: parsed.data.keyLabel || null,
    bpm: parsed.data.bpm ?? null,
  });

  if (error) {
    redirect("/songs/new?error=1");
  }

  redirect("/songs");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
