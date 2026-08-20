"use client";

import { useState } from "react";
import ChordPlayer, { type Chord } from "@/components/ChordPlayer";
import ProgressionEditor from "@/components/ProgressionEditor";

type SongDetailViewProps = {
  songId: string;
  songTitle: string;
  songBpm: number;
  savedProgression?: { name: string | null; chords: Chord[] };
};

export default function SongDetailView({
  songId,
  songTitle,
  songBpm,
  savedProgression,
}: SongDetailViewProps) {
  const [editing, setEditing] = useState(!savedProgression);

  if (editing) {
    return (
      <div>
        {savedProgression && (
          <div className="mx-auto max-w-2xl px-5 pt-6">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs uppercase tracking-wider text-dust underline"
            >
              ← Volver a tocar
            </button>
          </div>
        )}
        <ProgressionEditor
          songId={songId}
          songTitle={songTitle}
          songBpm={songBpm}
          initialChords={savedProgression?.chords ?? []}
          initialName={savedProgression?.name ?? undefined}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex max-w-2xl justify-end px-5 pt-6">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs uppercase tracking-wider text-dust underline"
        >
          Editar progresión
        </button>
      </div>
      <ChordPlayer
        progressions={[
          {
            id: "saved",
            name: savedProgression?.name ?? songTitle,
            bpm: songBpm,
            chords: savedProgression?.chords ?? [],
          },
        ]}
        title={songTitle}
        subtitle="Tu progresión guardada."
      />
    </div>
  );
}
