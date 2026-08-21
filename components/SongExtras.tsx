"use client";

import { useState } from "react";
import { saveLyrics, requestFeedback } from "@/app/songs/actions";

type FeedbackEntry = { id: string; response: string; created_at: string };

type SongExtrasProps = {
  songId: string;
  initialLyrics: string;
  initialFeedback: FeedbackEntry[];
};

export default function SongExtras({
  songId,
  initialLyrics,
  initialFeedback,
}: SongExtrasProps) {
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [savingLyrics, setSavingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const [feedbackHistory, setFeedbackHistory] = useState(initialFeedback);
  const [requesting, setRequesting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleSaveLyrics = async () => {
    setSavingLyrics(true);
    setLyricsError(null);
    const res = await saveLyrics({ songId, content: lyrics });
    setSavingLyrics(false);
    if (res.error) setLyricsError(res.error);
  };

  const handleRequestFeedback = async () => {
    setRequesting(true);
    setFeedbackError(null);
    const res = await requestFeedback(songId);
    setRequesting(false);
    if (res.error) {
      setFeedbackError(res.error);
      return;
    }
    if (res.feedback) {
      setFeedbackHistory((prev) => [
        { id: `local-${Date.now()}`, response: res.feedback!, created_at: new Date().toISOString() },
        ...prev,
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16">
      <section className="mb-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
          Letra
        </h2>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          maxLength={4000}
          rows={8}
          placeholder="Escribí acá la letra o las ideas que tengas hasta ahora..."
          className="border-flyer w-full resize-y bg-transparent px-3 py-2 text-sm text-paper outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveLyrics}
            disabled={savingLyrics || lyrics.trim().length === 0}
            className="rounded-[2px] bg-paper px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-ink disabled:opacity-50"
          >
            {savingLyrics ? "Guardando..." : "Guardar letra"}
          </button>
          {lyricsError && <span className="text-xs text-rust">{lyricsError}</span>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
          Asistente de concepto
        </h2>
        <button
          type="button"
          onClick={handleRequestFeedback}
          disabled={requesting}
          className="border-flyer px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {requesting ? "Pensando..." : "¿Qué opinás de esto?"}
        </button>
        {feedbackError && (
          <p className="mt-2 text-xs text-rust">{feedbackError}</p>
        )}

        {feedbackHistory.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {feedbackHistory.map((entry) => (
              <li key={entry.id} className="border-flyer-dashed px-4 py-3 text-sm">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-dust">
                  {new Date(entry.created_at).toLocaleString("es-AR")}
                </p>
                <p className="whitespace-pre-wrap">{entry.response}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
