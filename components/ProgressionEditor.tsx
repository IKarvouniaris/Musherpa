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
const DRAG_MIME = "application/x-musherpa-chord";

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
  // Index of the chip in "Tu progresión" armed for replacement: the next
  // chord you tap in the palette (or drop on it) swaps into that slot
  // instead of being appended at the end.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const placeChord = (root: (typeof ROOTS)[number], quality: ChordQuality, atIndex: number | null) => {
    setResult(null);
    const chord = buildChord(root, quality);
    if (atIndex !== null) {
      setChords((prev) => prev.map((c, i) => (i === atIndex ? chord : c)));
      setSelectedIndex(null);
      return;
    }
    setChords((prev) => (prev.length >= 32 ? prev : [...prev, chord]));
  };

  const toggleSelect = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const removeChord = (index: number) => {
    setResult(null);
    setSelectedIndex(null);
    setChords((prev) => prev.filter((_, i) => i !== index));
  };

  const moveChord = (index: number, direction: -1 | 1) => {
    setResult(null);
    setSelectedIndex(null);
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
    setSelectedIndex(null);
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

  const handlePaletteDragStart = (
    e: React.DragEvent,
    root: (typeof ROOTS)[number],
    quality: ChordQuality
  ) => {
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ root, quality }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleChipDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData(DRAG_MIME);
    if (!data) return;
    const { root, quality } = JSON.parse(data) as { root: (typeof ROOTS)[number]; quality: ChordQuality };
    placeChord(root, quality, index);
  };

  const handleSequenceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData(DRAG_MIME);
    if (!data) return;
    const { root, quality } = JSON.parse(data) as { root: (typeof ROOTS)[number]; quality: ChordQuality };
    placeChord(root, quality, null);
  };

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
        <p className="mb-2 text-xs text-dust">
          Tocá un acorde de acá abajo para seleccionarlo, y después tocá (o arrastrá) uno de la
          paleta para reemplazarlo.
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleSequenceDrop}
        >
          {chords.length === 0 ? (
            <p className="border-flyer-dashed px-4 py-3 text-sm text-dust">
              Todavía no agregaste ningún acorde. Tocá uno de la paleta de abajo.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {chords.map((chord, i) => (
                <div
                  key={`${chord.label}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelect(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleSelect(i);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleChipDrop(e, i)}
                  className={`flex cursor-pointer items-center gap-1 border-2 px-2 py-1 ${
                    selectedIndex === i
                      ? "border-rust bg-rust/20"
                      : "border-paper"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveChord(i, -1);
                    }}
                    disabled={i === 0}
                    className="px-1 text-xs disabled:opacity-30"
                    aria-label="Mover a la izquierda"
                  >
                    ‹
                  </button>
                  <span className="font-bold">{chord.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveChord(i, 1);
                    }}
                    disabled={i === chords.length - 1}
                    className="px-1 text-xs disabled:opacity-30"
                    aria-label="Mover a la derecha"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChord(i);
                    }}
                    className="ml-1 px-1 text-xs text-rust"
                    aria-label={`Quitar ${chord.label}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
          {selectedIndex !== null && (
            <span className="ml-2 normal-case text-rust">
              — elegí uno para reemplazar &quot;{chords[selectedIndex]?.label}&quot;
            </span>
          )}
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
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, root, quality)}
                    onClick={() => placeChord(root, quality, selectedIndex)}
                    title={QUALITY_LABELS[quality]}
                    className="cursor-grab rounded-[2px] bg-paper px-1 py-1 text-[11px] font-bold uppercase text-ink active:cursor-grabbing"
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
