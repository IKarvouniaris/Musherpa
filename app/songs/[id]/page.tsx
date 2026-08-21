import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SongDetailView from "@/components/SongDetailView";
import SongExtras from "@/components/SongExtras";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS already scopes this to the caller's own songs — .single() naturally
  // 404s if the id belongs to someone else, without a separate ownership check.
  const { data: song } = await supabase
    .from("songs")
    .select("id, title, key_label, bpm")
    .eq("id", id)
    .single();

  if (!song) notFound();

  const [{ data: progressionRows }, { data: lyricsRows }, { data: feedbackRows }] =
    await Promise.all([
      supabase
        .from("progressions")
        .select("id, name, chords")
        .eq("song_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("lyrics_drafts")
        .select("content")
        .eq("song_id", id)
        .order("version", { ascending: false })
        .limit(1),
      supabase
        .from("feedback_history")
        .select("id, response, created_at")
        .eq("song_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const saved = progressionRows?.[0];

  return (
    <>
      <SongDetailView
        songId={song.id}
        songTitle={song.title}
        songBpm={song.bpm ?? 120}
        savedProgression={
          saved ? { name: saved.name, chords: saved.chords } : undefined
        }
      />
      <SongExtras
        songId={song.id}
        initialLyrics={lyricsRows?.[0]?.content ?? ""}
        initialFeedback={feedbackRows ?? []}
      />
    </>
  );
}
