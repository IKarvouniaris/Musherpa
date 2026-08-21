"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { saveLyrics, requestFeedback } from "@/app/songs/actions";

type FeedbackEntry = { id: string; response: string; created_at: string };

type ConceptAssistantProps = {
  songId: string;
  initialLyrics: string;
  initialFeedback: FeedbackEntry[];
};

// Floating button + panel, pinned to the viewport (not the page) so it
// stays reachable no matter how far down the chord player / editor the
// user has scrolled — same pattern as a chat widget.
export default function ConceptAssistant({
  songId,
  initialLyrics,
  initialFeedback,
}: ConceptAssistantProps) {
  const [open, setOpen] = useState(false);

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
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente de concepto" : "Abrir asistente de concepto"}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-[2px] border-2 border-paper bg-rust px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-paper shadow-[4px_4px_0_0_#141210]"
      >
        {open ? <X size={16} /> : <Sparkles size={16} />}
        Asistente
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex max-h-[75vh] w-[92vw] max-w-sm flex-col border-2 border-paper bg-ink shadow-[6px_6px_0_0_#c9402a]">
          <div className="flex items-center justify-between border-b-2 border-paper px-4 py-3">
            <h2 className="font-display text-lg font-black uppercase tracking-tight">
              Asistente de concepto
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-dust hover:text-paper"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <section className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-dust">
                Letra
              </h3>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                maxLength={4000}
                rows={6}
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
              <button
                type="button"
                onClick={handleRequestFeedback}
                disabled={requesting}
                className="border-flyer w-full px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {requesting ? "Pensando..." : "¿Qué opinás de esto?"}
              </button>
              {feedbackError && (
                <p className="mt-2 text-xs text-rust">{feedbackError}</p>
              )}

              {feedbackHistory.length > 0 && (
                <ul className="mt-4 flex flex-col gap-3">
                  {feedbackHistory.map((entry) => (
                    <li key={entry.id} className="border-flyer-dashed px-3 py-3 text-sm">
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
        </div>
      )}
    </>
  );
}
