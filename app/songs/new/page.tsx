import { createSong } from "../actions";

export default async function NewSongPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-5 py-10">
      <h1 className="mb-6 font-display text-3xl font-black uppercase tracking-tight">
        Nueva canción
      </h1>
      <form action={createSong} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Título
          <input
            name="title"
            required
            maxLength={200}
            className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tono (opcional)
          <input
            name="keyLabel"
            maxLength={10}
            className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          BPM (opcional)
          <input
            name="bpm"
            type="number"
            min={20}
            max={300}
            className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
          />
        </label>
        {error && (
          <p className="text-sm text-rust">
            No pudimos guardar la canción. Revisá los datos.
          </p>
        )}
        <button
          type="submit"
          className="rounded-[2px] bg-paper px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-ink"
        >
          Guardar
        </button>
      </form>
    </main>
  );
}
