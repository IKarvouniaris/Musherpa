"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Square } from "lucide-react";
import { saveDrumPattern } from "@/app/songs/actions";
import { DRUM_STEPS, type DrumPatternSteps, type DrumVoice } from "@/lib/validation/song";

const VOICE_LABELS: Record<DrumVoice, string> = {
  kick: "Bombo",
  snare: "Redoblante",
  hihat: "Hi-hat",
};

const emptySteps = (): boolean[] => Array(DRUM_STEPS).fill(false);

type DrumEditorProps = {
  songId: string;
  songBpm: number;
  initialSteps?: DrumPatternSteps;
  initialName?: string;
};

export default function DrumEditor({
  songId,
  songBpm,
  initialSteps,
  initialName,
}: DrumEditorProps) {
  const [kick, setKick] = useState<boolean[]>(initialSteps?.kick ?? emptySteps());
  const [snare, setSnare] = useState<boolean[]>(initialSteps?.snare ?? emptySteps());
  const [hihat, setHihat] = useState<boolean[]>(initialSteps?.hihat ?? emptySteps());
  const [name, setName] = useState(initialName ?? "");
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ error: string | null; success: boolean } | null>(null);

  // The running Tone.Sequence reads steps through these refs (not the
  // React state directly) so toggling a cell while it's playing changes
  // the next hit immediately — the normal way a step sequencer behaves,
  // instead of needing to stop/replay like the chord progression player.
  const kickRef = useRef(kick);
  const snareRef = useRef(snare);
  const hihatRef = useRef(hihat);
  useEffect(() => {
    kickRef.current = kick;
  }, [kick]);
  useEffect(() => {
    snareRef.current = snare;
  }, [snare]);
  useEffect(() => {
    hihatRef.current = hihat;
  }, [hihat]);

  const kickSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const snareSynthRef = useRef<Tone.NoiseSynth | null>(null);
  const hihatSynthRef = useRef<Tone.NoiseSynth | null>(null);
  const hihatFilterRef = useRef<Tone.Filter | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const audioReadyRef = useRef(false);

  const ensureAudioGraph = () => {
    if (audioReadyRef.current) return;
    kickSynthRef.current = new Tone.MembraneSynth({
      octaves: 6,
      pitchDecay: 0.05,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.6 },
    }).toDestination();

    snareSynthRef.current = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
    }).toDestination();

    const hihatFilter = new Tone.Filter(7000, "highpass").toDestination();
    hihatSynthRef.current = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    }).connect(hihatFilter);
    hihatFilterRef.current = hihatFilter;

    audioReadyRef.current = true;
  };

  useEffect(() => {
    return () => {
      kickSynthRef.current?.dispose();
      snareSynthRef.current?.dispose();
      hihatSynthRef.current?.dispose();
      hihatFilterRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    setPlaying(false);
    setCurrentStep(-1);
  };

  const start = async () => {
    ensureAudioGraph();
    await Tone.start();
    if (Tone.context.state !== "running") {
      await Tone.context.resume();
    }
    stop();
    Tone.Transport.bpm.value = songBpm;

    const seq = new Tone.Sequence(
      (time, stepIdx: number) => {
        if (kickRef.current[stepIdx]) {
          kickSynthRef.current?.triggerAttackRelease("C1", "16n", time);
        }
        if (snareRef.current[stepIdx]) {
          snareSynthRef.current?.triggerAttackRelease("16n", time);
        }
        if (hihatRef.current[stepIdx]) {
          hihatSynthRef.current?.triggerAttackRelease("16n", time);
        }
        Tone.Draw.schedule(() => setCurrentStep(stepIdx), time);
      },
      Array.from({ length: DRUM_STEPS }, (_, i) => i),
      "16n"
    );
    seq.start(0);
    sequenceRef.current = seq;
    Tone.Transport.start();
    setPlaying(true);
  };

  const handlePlayToggle = () => {
    if (playing) {
      stop();
    } else {
      start();
    }
  };

  const toggleStep = (voice: DrumVoice, index: number) => {
    setResult(null);
    const setter = voice === "kick" ? setKick : voice === "snare" ? setSnare : setHihat;
    setter((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const clearAll = () => {
    setResult(null);
    setKick(emptySteps());
    setSnare(emptySteps());
    setHihat(emptySteps());
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await saveDrumPattern({
      songId,
      name: name || undefined,
      steps: { kick, snare, hihat },
    });
    setSaving(false);
    setResult(res);
  };

  const rows: { voice: DrumVoice; steps: boolean[] }[] = [
    { voice: "kick", steps: kick },
    { voice: "snare", steps: snare },
    { voice: "hihat", steps: hihat },
  ];

  const hasAnyStep = kick.some(Boolean) || snare.some(Boolean) || hihat.some(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8">
      <header className="mb-6 border-b-[3px] border-paper pb-4">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Batería
        </h1>
        <p className="mt-2 text-sm text-dust">
          Marcá los pasos donde querés que pegue cada instrumento. Es opcional —
          la canción funciona igual sin esto.
        </p>
      </header>

      <label className="mb-6 flex flex-col gap-1 text-sm">
        Nombre del patrón (opcional)
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Patrón base"
          className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
        />
      </label>

      <section className="mb-6 overflow-x-auto">
        <div className="flex min-w-[560px] flex-col gap-2">
          {rows.map(({ voice, steps }) => (
            <div key={voice} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-dust">
                {VOICE_LABELS[voice]}
              </span>
              <div className="flex gap-1">
                {steps.map((active, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleStep(voice, i)}
                    aria-pressed={active}
                    aria-label={`${VOICE_LABELS[voice]}, paso ${i + 1}`}
                    className={`h-8 w-8 border-2 ${
                      i % 4 === 0 ? "border-l-4" : ""
                    } ${
                      currentStep === i ? "border-rust" : "border-faded"
                    } ${active ? "bg-rust" : "bg-transparent"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-flyer-dashed mb-8 flex flex-wrap items-center gap-4 p-4">
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`flex items-center gap-2 rounded-[2px] px-5 py-3 text-sm font-extrabold uppercase tracking-wider ${
            playing ? "bg-rust text-paper" : "bg-paper text-ink"
          }`}
        >
          {playing ? <Square size={16} /> : <Play size={16} />}
          {playing ? "Parar" : "Tocar"}
        </button>
        <span className="text-xs text-dust">{songBpm} bpm</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs uppercase tracking-wider text-dust underline"
        >
          Vaciar todo
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasAnyStep}
          className="rounded-[2px] bg-paper px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-ink disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar patrón"}
        </button>
        {result?.success && <span className="text-sm text-paper">Guardado.</span>}
        {result?.error && <span className="text-sm text-rust">{result.error}</span>}
      </div>
    </div>
  );
}
