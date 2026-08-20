import type { Chord } from "@/lib/validation/song";

export const ROOTS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type Root = (typeof ROOTS)[number];
export type ChordQuality = "maj" | "min" | "5";

export const QUALITY_LABELS: Record<ChordQuality, string> = {
  maj: "Mayor",
  min: "Menor",
  "5": "Power",
};

function noteAt(root: Root, semitonesUp: number, baseOctave: number): string {
  const rootIndex = ROOTS.indexOf(root);
  const total = rootIndex + semitonesUp;
  const octaveOffset = Math.floor(total / 12);
  const noteIndex = ((total % 12) + 12) % 12;
  return `${ROOTS[noteIndex]}${baseOctave + octaveOffset}`;
}

// Builds a chord's notes from music theory (root + interval pattern)
// instead of hand-listing every root/quality combination.
export function buildChord(root: Root, quality: ChordQuality): Chord {
  if (quality === "5") {
    return {
      label: `${root}5`,
      notes: [noteAt(root, 0, 2), noteAt(root, 7, 2)],
      bass: noteAt(root, 0, 1),
    };
  }

  const thirdInterval = quality === "maj" ? 4 : 3;
  return {
    label: quality === "maj" ? root : `${root}m`,
    notes: [noteAt(root, 0, 3), noteAt(root, thirdInterval, 3), noteAt(root, 7, 3)],
    bass: noteAt(root, 0, 2),
  };
}
