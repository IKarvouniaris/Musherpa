import "server-only";
import { GoogleGenAI } from "@google/genai";

// "server-only" makes it a build error to ever import this from client
// code — GEMINI_API_KEY must never end up in a browser bundle.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-3.7-flash";
const TIMEOUT_MS = 20_000;

const SYSTEM_INSTRUCTION = `Sos un asistente de composición para una banda de garage rock.
Te paso los datos de una canción en progreso: título, tono, bpm, acordes y letra (si existe).
Respondé en español, en un tono directo y sin vueltas, en no más de 120 palabras.
Dá una opinión concisa sobre la coherencia entre la música y la letra, y 1 o 2 sugerencias
puntuales y accionables. Si falta la letra o la progresión, decilo y sugerí por dónde arrancar
en base a lo que sí hay. No inventes datos que no te dieron.`;

export async function getSongFeedback(songSummary: string): Promise<string> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS);
  });

  const interaction = await Promise.race([
    ai.interactions.create({
      model: MODEL,
      system_instruction: SYSTEM_INSTRUCTION,
      input: songSummary,
      stream: false,
    }),
    timeout,
  ]);

  return interaction.output_text?.trim() || "No recibimos una respuesta clara. Probá de nuevo.";
}
