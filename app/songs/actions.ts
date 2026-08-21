"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSongFeedback } from "@/lib/gemini/client";
import {
  createSongSchema,
  createProgressionSchema,
  saveLyricsSchema,
  songIdSchema,
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

export type SaveLyricsResult = { error: string | null; success: boolean };

export async function saveLyrics(input: {
  songId: string;
  content: string;
}): Promise<SaveLyricsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = saveLyricsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Esa letra no es válida.", success: false };
  }

  const { data: lastVersion } = await supabase
    .from("lyrics_drafts")
    .select("version")
    .eq("song_id", parsed.data.songId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Same trust model as everywhere else: RLS on lyrics_drafts is what
  // actually enforces that song_id belongs to this user.
  const { error } = await supabase.from("lyrics_drafts").insert({
    song_id: parsed.data.songId,
    content: parsed.data.content,
    version: (lastVersion?.version ?? 0) + 1,
  });

  if (error) {
    return { error: "No pudimos guardar la letra.", success: false };
  }

  revalidatePath(`/songs/${parsed.data.songId}`);
  return { error: null, success: true };
}

export type FeedbackResult = { error: string | null; feedback: string | null };

const FEEDBACK_COOLDOWN_SECONDS = 60;

export async function requestFeedback(songId: string): Promise<FeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!songIdSchema.safeParse(songId).success) {
    return { error: "Canción inválida.", feedback: null };
  }

  // RLS-scoped: if this song isn't the caller's, this comes back null and
  // we never reach the point of calling Gemini or touching feedback_history.
  const { data: song } = await supabase
    .from("songs")
    .select("id, title, key_label, bpm")
    .eq("id", songId)
    .single();

  if (!song) {
    return { error: "No encontramos esa canción.", feedback: null };
  }

  // Cheap per-song rate limit reusing feedback_history itself — no new
  // infra needed, and it directly bounds how often we pay for a Gemini call.
  const cooldownStart = new Date(
    Date.now() - FEEDBACK_COOLDOWN_SECONDS * 1000
  ).toISOString();
  const { count } = await supabase
    .from("feedback_history")
    .select("id", { count: "exact", head: true })
    .eq("song_id", songId)
    .gte("created_at", cooldownStart);

  if ((count ?? 0) > 0) {
    return {
      error: "Esperá un minuto antes de pedir feedback de nuevo.",
      feedback: null,
    };
  }

  const [{ data: progressionRows }, { data: lyricsRows }] = await Promise.all([
    supabase
      .from("progressions")
      .select("chords")
      .eq("song_id", songId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("lyrics_drafts")
      .select("content")
      .eq("song_id", songId)
      .order("version", { ascending: false })
      .limit(1),
  ]);

  const chords = progressionRows?.[0]?.chords as Chord[] | undefined;
  const lyrics = lyricsRows?.[0]?.content as string | undefined;

  const summary = [
    `Título: ${song.title}`,
    `Tono: ${song.key_label ?? "sin especificar"}`,
    `BPM: ${song.bpm ?? "sin especificar"}`,
    `Acordes: ${
      chords && chords.length > 0
        ? chords.map((c) => c.label).join(" - ")
        : "todavía no tiene progresión"
    }`,
    `Letra: ${lyrics ?? "todavía no tiene letra"}`,
  ].join("\n");

  let feedbackText: string;
  try {
    feedbackText = await getSongFeedback(summary);
  } catch {
    return {
      error: "No pudimos conseguir feedback ahora. Probá de nuevo en un rato.",
      feedback: null,
    };
  }

  // Best-effort logging: if the insert fails we still hand back the
  // feedback we already paid for instead of throwing it away.
  await supabase.from("feedback_history").insert({
    song_id: songId,
    prompt_sent: summary,
    response: feedbackText,
  });

  revalidatePath(`/songs/${songId}`);
  return { error: null, feedback: feedbackText };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
