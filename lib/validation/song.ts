import { z } from "zod";

export const chordSchema = z.object({
  label: z.string().trim().min(1).max(10),
  notes: z.array(z.string().trim().min(1).max(6)).min(1).max(6),
  bass: z.string().trim().min(1).max(6),
});

export type Chord = z.infer<typeof chordSchema>;

export const createSongSchema = z.object({
  title: z.string().trim().min(1, "El título no puede estar vacío").max(200),
  keyLabel: z.string().trim().max(10).optional().or(z.literal("")),
  bpm: z.coerce.number().int().min(20).max(300).optional(),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;

export const createProgressionSchema = z.object({
  songId: z.string().uuid(),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  chords: z.array(chordSchema).min(1).max(32),
});

export type CreateProgressionInput = z.infer<typeof createProgressionSchema>;

export const songIdSchema = z.string().uuid();

export const saveLyricsSchema = z.object({
  songId: songIdSchema,
  content: z.string().trim().min(1).max(4000),
});

export type SaveLyricsInput = z.infer<typeof saveLyricsSchema>;

export const DRUM_STEPS = 16;
export const DRUM_VOICES = ["kick", "snare", "hihat"] as const;
export type DrumVoice = (typeof DRUM_VOICES)[number];

export const drumPatternStepsSchema = z.object({
  kick: z.array(z.boolean()).length(DRUM_STEPS),
  snare: z.array(z.boolean()).length(DRUM_STEPS),
  hihat: z.array(z.boolean()).length(DRUM_STEPS),
});

export type DrumPatternSteps = z.infer<typeof drumPatternStepsSchema>;

export const saveDrumPatternSchema = z.object({
  songId: songIdSchema,
  name: z.string().trim().max(120).optional().or(z.literal("")),
  steps: drumPatternStepsSchema,
});

export type SaveDrumPatternInput = z.infer<typeof saveDrumPatternSchema>;
