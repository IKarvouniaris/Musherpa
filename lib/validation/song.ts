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
