"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSongSchema,
  createProgressionSchema,
  type Chord,
} from "@/lib/validation/song";

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
    console.error("createSong insert failed:", error.code, error.message);
    redirect("/songs/new?error=1");
  }

  redirect("/songs");
}

export type SaveProgressionResult = { error: string | null; success: boolean };

export async function saveProgression(input: {
  songId: string;
  name?: string;
  chords: Chord[];
}): Promise<SaveProgressionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = createProgressionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Esa progresión no es válida.", success: false };
  }

  // No manual "is this my song?" check here on purpose: the RLS insert
  // policy on `progressions` already requires song_id to point at a song
  // owned by auth.uid(), so a tampered songId is rejected by Postgres
  // itself, not by app logic that could have a bug.
  const { error } = await supabase.from("progressions").insert({
    song_id: parsed.data.songId,
    name: parsed.data.name || null,
    chords: parsed.data.chords,
  });

  if (error) {
    return { error: "No pudimos guardar la progresión.", success: false };
  }

  revalidatePath(`/songs/${parsed.data.songId}`);
  return { error: null, success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
