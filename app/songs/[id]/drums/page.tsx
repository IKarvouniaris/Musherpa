import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DrumEditor from "@/components/DrumEditor";
import type { DrumPatternSteps } from "@/lib/validation/song";

export default async function SongDrumsPage({
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

  const { data: song } = await supabase
    .from("songs")
    .select("id, bpm")
    .eq("id", id)
    .single();

  if (!song) notFound();

  const { data: patternRows } = await supabase
    .from("drum_patterns")
    .select("name, steps")
    .eq("song_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const saved = patternRows?.[0];

  return (
    <>
      <div className="mx-auto max-w-2xl px-5 pt-6">
        <Link
          href={`/songs/${id}`}
          className="text-xs uppercase tracking-wider text-dust underline"
        >
          ← Volver a la canción
        </Link>
      </div>
      <DrumEditor
        songId={song.id}
        songBpm={song.bpm ?? 120}
        initialSteps={saved?.steps as DrumPatternSteps | undefined}
        initialName={saved?.name ?? undefined}
      />
    </>
  );
}
