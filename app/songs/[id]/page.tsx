import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SongDetailView from "@/components/SongDetailView";

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

  const { data: progressionRows } = await supabase
    .from("progressions")
    .select("id, name, chords")
    .eq("song_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const saved = progressionRows?.[0];

  return (
    <SongDetailView
      songId={song.id}
      songTitle={song.title}
      songBpm={song.bpm ?? 120}
      savedProgression={
        saved ? { name: saved.name, chords: saved.chords } : undefined
      }
    />
  );
}
