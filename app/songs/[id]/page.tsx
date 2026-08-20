import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChordPlayer, { type Progression } from "@/components/ChordPlayer";

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

  const progressions: Progression[] | undefined = saved
    ? [
        {
          id: saved.id,
          name: saved.name ?? song.title,
          keyLabel: song.key_label ?? undefined,
          bpm: song.bpm ?? 120,
          chords: saved.chords as Progression["chords"],
        },
      ]
    : undefined;

  return (
    <ChordPlayer
      progressions={progressions}
      title={song.title}
      subtitle={
        progressions
          ? "Tu progresión guardada."
          : "Todavía no guardaste una progresión propia — mostrando la demo mientras tanto."
      }
    />
  );
}
