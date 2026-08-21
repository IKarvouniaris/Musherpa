"use client";

import { useState } from "react";
import { saveLyrics } from "@/app/songs/actions";

type LyricsEditorProps = {
  songId: string;
  initialLyrics: string;
};

export default function LyricsEditor({ songId, initialLyrics }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await saveLyrics({ songId, content: lyrics });
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
        Letra
      </h2>
      <textarea
        value={lyrics}
        onChange={(e) => {
          setLyrics(e.target.value);
          setSaved(false);
        }}
        maxLength={4000}
        rows={10}
        placeholder="Escribí acá la letra o las ideas que tengas hasta ahora..."
        className="border-flyer w-full resize-y bg-transparent px-3 py-2 text-sm text-paper outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || lyrics.trim().length === 0}
          className="rounded-[2px] bg-paper px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-ink disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar letra"}
        </button>
        {saved && <span className="text-xs text-paper">Guardada.</span>}
        {error && <span className="text-xs text-rust">{error}</span>}
      </div>
    </div>
  );
}
