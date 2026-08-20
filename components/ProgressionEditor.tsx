"use client";

import { useMemo, useState } from "react";
import ChordPlayer, { type Progression, type Chord } from "@/components/ChordPlayer";
import { saveProgression } from "@/app/songs/actions";
import { ROOTS, QUALITY_LABELS, buildChord, type ChordQuality } from "@/lib/music/chords";

type ProgressionEditorProps = {
  songId: string;
  songTitle: string;
  songBpm: number;
  initialChords: Chord[];
  initialName?: string;
};

const QUALITIES: ChordQuality[] = ["maj", "min", "5"];

export default function ProgressionEditor({
  songId,
  songTitle,
  songBpm,
  initialChords,
  initialName,
}: ProgressionEditorProps) {
  const [chords, setChords] = useState<Chord[]>(initialChords);
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ error: string | null; success: boolean } | null>(null);

  const addChord = (root: (typeof ROOTS)[number], quality: ChordQuality) => {
    setResult(null);
    setChords((prev) => {
      if (prev.length >= 32) return prev;
      return [...prev, buildChord(root, quality)];
    });
  };

  const removeChord = (index: number) => {
    setResult(null);
    setChords((prev) => prev.filter((_, i) => i !== index));
  };

  const moveChord = (index: number, direction: -1 | 1) => {
    setResult(null);
    setChords((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const clearAll = () => {
    setResult(null);
    setChords([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await saveProgression({ songId, name: name || undefined, chords });
    setSaving(false);
    setResult(res);
  };

  const previewProgressions: Progression[] = useMemo(
    () => [
      {
        id: "draft",
        name: name || songTitle,
        bpm: songBpm,
        chords,
      },
    ],
    [chords, name, songBpm, songTitle]
  );

  // Remounting ChordPlayer on every edit (via key) is simpler and safer
  // than trying to hot-patch a running Tone.js sequence — its own cleanup
  // effect disposes the old audio graph, and a fresh one is built for the
  // updated chords.
  const previewKey = chords.map((c) => c.label).join("-") || "empty";

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8">
      <header className="mb-6 border-b-[3px] border-paper pb-4">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Editor de progresión
        </h1>
        <p className="mt-2 text-sm text-dust">
          Elegí acordes de la paleta para armar tu propia progresión para &quot;{songTitle}&quot;.
        </p>
      </header>

      <label className="mb-6 flex flex-col gap-1 text-sm">
        Nombre de la progresión (opcional)
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder={songTitle}
          className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
        />
      </label>

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
          Tu progresión ({chords.length}/32)
        </h2>
        {chords.length === 0 ? (
          <p className="border-flyer-dashed px-4 py-3 text-sm text-dust">
            Todavía no agregaste ningún acorde. Tocá uno de la paleta de abajo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chords.map((chord, i) => (
              <div
                key={`${chord.label}-${i}`}
                className="border-flyer flex items-center gap-1 px-2 py-1"
              >
                <button
                  type="button"
                  onClick={() => moveChord(i, -1)}
                  disabled={i === 0}
                  className="px-1 text-xs disabled:opacity-30"
                  aria-label="Mover a la izquierda"
                >
                  ‹
                </button>
                <span className="font-bold">{chord.label}</span>
                <button
                  type="button"
                  onClick={() => moveChord(i, 1)}
                  disabled={i === chords.length - 1}
                  className="px-1 text-xs disabled:opacity-30"
                  aria-label="Mover a la derecha"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => removeChord(i)}
                  className="ml-1 px-1 text-xs text-rust"
                  aria-label={`Quitar ${chord.label}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {chords.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="mt-2 text-xs uppercase tracking-wider text-dust underline"
          >
            Vaciar todo
          </button>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
          Paleta de acordes
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ROOTS.map((root) => (
            <div key={root} className="border-flyer p-2">
              <p className="mb-1 text-center text-sm font-bold">{root}</p>
              <div className="flex flex-col gap-1">
                {QUALITIES.map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => addChord(root, quality)}
                    title={QUALITY_LABELS[quality]}
                    className="rounded-[2px] bg-paper px-1 py-1 text-[11px] font-bold uppercase text-ink"
                  >
                    {QUALITY_LABELS[quality]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || chords.length === 0}
          className="rounded-[2px] bg-paper px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-ink disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar progresión"}
        </button>
        {result?.success && (
          <span className="text-sm text-paper">Guardada.</span>
        )}
        {result?.error && <span className="text-sm text-rust">{result.error}</span>}
      </div>

      {chords.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
            Vista previa
          </h2>
          <ChordPlayer
            key={previewKey}
            progressions={previewProgressions}
            title={name || songTitle}
            subtitle="Se reinicia cada vez que cambiás algo — no hace falta guardar para escuchar."
          />
        </section>
      )}
    </div>
  );
}
