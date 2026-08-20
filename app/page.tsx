import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChordPlayer from "@/components/ChordPlayer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-end gap-4 px-5 pt-6 text-xs uppercase tracking-wider">
        {user ? (
          <Link href="/songs" className="underline">
            Tus canciones
          </Link>
        ) : (
          <>
            <Link href="/login" className="underline">
              Entrar
            </Link>
            <Link href="/signup" className="underline">
              Registrate
            </Link>
          </>
        )}
      </div>
      <ChordPlayer />
    </>
  );
}
