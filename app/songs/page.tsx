import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function SongsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, key_label, bpm")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between border-b-[3px] border-paper pb-4">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Tus canciones
        </h1>
        <form action={logout}>
          <button className="text-xs uppercase tracking-wider text-dust underline">
            Salir
          </button>
        </form>
      </div>

      {user.is_anonymous && (
        <p className="border-flyer-dashed mb-6 px-4 py-3 text-sm text-dust">
          Estás probando sin cuenta — si borrás las cookies del navegador perdés
          tus canciones.{" "}
          <Link href="/signup" className="text-paper underline">
            Creá una cuenta
          </Link>{" "}
          y seguís exactamente donde estabas.
        </p>
      )}

      <Link
        href="/songs/new"
        className="border-flyer mb-6 inline-block px-4 py-2 text-sm font-bold uppercase tracking-wider"
      >
        + Nueva canción
      </Link>

      {!songs || songs.length === 0 ? (
        <p className="text-sm text-dust">Todavía no armaste ninguna canción.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {songs.map((song) => (
            <li key={song.id}>
              <Link
                href={`/songs/${song.id}`}
                className="border-flyer flex items-center justify-between px-4 py-3"
              >
                <span className="font-bold">{song.title}</span>
                <span className="text-xs text-dust">
                  {song.key_label ?? "—"} · {song.bpm ?? "—"} bpm
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
