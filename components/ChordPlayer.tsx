"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Square, Guitar, Volume2 } from "lucide-react";

export type Chord = {
  label: string;
  notes: string[];
  bass: string;
};

export type Progression = {
  id: string;
  name: string;
  keyLabel?: string;
  bpm: number;
  note?: string;
  chords: Chord[];
};

// Demo set from the original prototype — used as the Fase 0 standalone demo
// and as seed data. Once a song has its own saved progression (Fase 1+),
// that's what gets passed in via the `progressions` prop instead.
export const DEMO_PROGRESSIONS: Progression[] = [
  {
    id: "callate",
    name: "CALLATE LA BOCA",
    keyLabel: "Em",
    bpm: 128,
    note: "La de manual: menor, cuatro acordes, sirve para casi cualquier estribillo garagero.",
    chords: [
      { label: "Em", notes: ["E3", "G3", "B3"], bass: "E2" },
      { label: "C", notes: ["C3", "E3", "G3"], bass: "C2" },
      { label: "G", notes: ["G3", "B3", "D4"], bass: "G2" },
      { label: "D", notes: ["D3", "F#3", "A3"], bass: "D2" },
    ],
  },
  {
    id: "vereda",
    name: "VEREDA ROTA",
    keyLabel: "A",
    bpm: 148,
    note: "Solo tres power chords. Palm mute todo el verso, abrí en el estribillo.",
    chords: [
      { label: "A5", notes: ["A2", "E3"], bass: "A1" },
      { label: "D5", notes: ["D3", "A3"], bass: "D2" },
      { label: "E5", notes: ["E3", "B3"], bass: "E2" },
    ],
  },
  {
    id: "algunDia",
    name: "ALGUN DIA VOLVES",
    keyLabel: "Em",
    bpm: 100,
    note: "Más melancólica, tipo 'Someday'. Buena para versos hablados y estribillo cantado.",
    chords: [
      { label: "Em", notes: ["E3", "G3", "B3"], bass: "E2" },
      { label: "A", notes: ["A2", "C#3", "E3"], bass: "A1" },
      { label: "C", notes: ["C3", "E3", "G3"], bass: "C2" },
      { label: "D", notes: ["D3", "F#3", "A3"], bass: "D2" },
    ],
  },
  {
    id: "cuatroCuadras",
    name: "CUATRO CUADRAS",
    keyLabel: "G",
    bpm: 138,
    note: "Cuatro al piso, para tocar con la batería bien seca y sin vueltas.",
    chords: [
      { label: "G", notes: ["G3", "B3", "D4"], bass: "G2" },
      { label: "Bm", notes: ["B2", "D3", "F#3"], bass: "B1" },
      { label: "C", notes: ["C3", "E3", "G3"], bass: "C2" },
      { label: "D", notes: ["D3", "F#3", "A3"], bass: "D2" },
    ],
  },
];

type ChordPlayerProps = {
  progressions?: Progression[];
  title?: string;
  subtitle?: string;
};

export default function ChordPlayer({
  progressions = DEMO_PROGRESSIONS,
  title = "Progresiones sucias",
  subtitle = "Elegí una, dale play, y probá tocar la línea de bajo (raíz de cada acorde) arriba mientras suena.",
}: ChordPlayerProps) {
  const [activeId, setActiveId] = useState(progressions[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [stepIndex, setStepIndex] = useState(-1);
  const [bpm, setBpm] = useState(progressions[0]?.bpm ?? 120);

  const chordSynthRef = useRef<Tone.PolySynth | null>(null);
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const bitcrusherRef = useRef<Tone.BitCrusher | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const audioReadyRef = useRef(false);

  const progression = progressions.find((p) => p.id === activeId) ?? progressions[0];

  // Nodes are built lazily on the first tap (inside the click handler),
  // not on mount — creating/resuming the AudioContext outside a direct
  // user gesture is what breaks autoplay on iOS/Android mobile browsers.
  const ensureAudioGraph = () => {
    if (audioReadyRef.current) return;
    const distortion = new Tone.Distortion(0.35);
    const bitcrusher = new Tone.BitCrusher(8);
    const filter = new Tone.Filter(2600, "lowpass");
    const chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.35, release: 0.4 },
      volume: -4,
    });
    const bassSynth = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 },
      volume: -2,
    });

    chordSynth.chain(distortion, bitcrusher, filter, Tone.Destination);
    bassSynth.chain(filter, Tone.Destination);

    chordSynthRef.current = chordSynth;
    bassSynthRef.current = bassSynth;
    distortionRef.current = distortion;
    bitcrusherRef.current = bitcrusher;
    audioReadyRef.current = true;
  };

  useEffect(() => {
    return () => {
      chordSynthRef.current?.dispose();
      bassSynthRef.current?.dispose();
      distortionRef.current?.dispose();
      bitcrusherRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (distortionRef.current) {
      distortionRef.current.wet.value = dirty ? 1 : 0;
    }
    if (bitcrusherRef.current) {
      bitcrusherRef.current.wet.value = dirty ? 0.5 : 0;
    }
  }, [dirty]);

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    setPlaying(false);
    setStepIndex(-1);
  };

  const start = async (prog: Progression) => {
    ensureAudioGraph();
    await Tone.start();
    if (Tone.context.state !== "running") {
      await Tone.context.resume();
    }
    stop();
    // Tone.Transport is Tone.js's own imperative scheduler, not React state —
    // the immutability rule doesn't apply to it.
    // eslint-disable-next-line react-hooks/immutability
    Tone.Transport.bpm.value = bpm;

    const chords = prog.chords;
    const seq = new Tone.Sequence(
      (time, idx) => {
        const chord = chords[idx];
        chordSynthRef.current?.triggerAttackRelease(chord.notes, "1n", time);
        bassSynthRef.current?.triggerAttackRelease(chord.bass, "1n", time);
        Tone.Draw.schedule(() => setStepIndex(idx), time);
      },
      chords.map((_, i) => i),
      "1n"
    );
    seq.start(0);
    sequenceRef.current = seq;
    Tone.Transport.start();
    setPlaying(true);
  };

  const handlePlayToggle = () => {
    if (playing) {
      stop();
    } else if (progression) {
      start(progression);
    }
  };

  const handleSelect = (prog: Progression) => {
    setActiveId(prog.id);
    setBpm(prog.bpm);
    if (playing) {
      start(prog);
    }
  };

  useEffect(() => {
    if (playing) Tone.Transport.bpm.rampTo(bpm, 0.1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  if (!progression) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-8">
      <header className="mb-7 border-b-[3px] border-paper pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-[clamp(28px,6vw,44px)] font-black uppercase tracking-tight">
            {title}
          </h1>
          <span className="text-xs font-bold tracking-[0.15em] text-rust">
            VOL. 1 — DEMO
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-dust">{subtitle}</p>
      </header>

      <div className="mb-6 grid gap-2.5">
        {progressions.map((p) => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`border-flyer px-3.5 py-3 text-left transition-colors ${
                isActive ? "bg-paper text-ink" : "bg-transparent text-paper"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold tracking-wide">{p.name}</span>
                <span className="text-xs opacity-70">
                  {p.keyLabel} · {p.bpm} bpm
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.chords.map((c, i) => {
                  const isSounding = isActive && stepIndex === i && playing;
                  return (
                    <span
                      key={i}
                      className={`rounded-[2px] border px-2 py-0.5 text-[13px] font-bold ${
                        isActive ? "border-ink" : "border-paper"
                      } ${isSounding ? "bg-rust text-paper" : "bg-transparent"}`}
                    >
                      {c.label}
                    </span>
                  );
                })}
              </div>
              {isActive && p.note && (
                <p className="mt-2 text-xs text-faded">{p.note}</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-flyer-dashed flex flex-wrap items-center gap-4 p-4">
        <button
          onClick={handlePlayToggle}
          className={`flex items-center gap-2 rounded-[2px] px-5 py-3 text-sm font-extrabold uppercase tracking-wider ${
            playing ? "bg-rust text-paper" : "bg-paper text-ink"
          }`}
        >
          {playing ? <Square size={16} /> : <Play size={16} />}
          {playing ? "Parar" : "Tocar"}
        </button>

        <label className="flex items-center gap-2 text-[13px]">
          <Guitar size={16} />
          Sucio
          <input
            type="checkbox"
            checked={dirty}
            onChange={(e) => setDirty(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex min-w-[160px] flex-1 items-center gap-2 text-[13px]">
          <Volume2 size={16} />
          {bpm} bpm
          <input
            type="range"
            min={70}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-faded">
        Tip: la línea de bajo que suena es la raíz de cada acorde en octava grave — esa es la
        forma más simple de empezar a tocar sobre la progresión sin pensar en escalas todavía.
        Una vez que la raíz te queda cómoda, probá agregar la quinta o pasar cromáticamente al
        acorde siguiente.
      </p>
    </div>
  );
}
