import Link from "next/link";
import LoginForm from "./LoginForm";
import { continueAsGuest } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ guestError?: string }>;
}) {
  const { guestError } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="mb-6 font-display text-3xl font-black uppercase tracking-tight">
        Entrar
      </h1>
      <LoginForm />

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-faded">
        <span className="h-px flex-1 bg-faded" />
        o
        <span className="h-px flex-1 bg-faded" />
      </div>

      <form action={continueAsGuest}>
        <button
          type="submit"
          className="border-flyer w-full px-5 py-3 text-sm font-bold uppercase tracking-wider"
        >
          Probar sin cuenta
        </button>
      </form>
      {guestError && (
        <p className="mt-3 text-sm text-rust">
          No pudimos iniciarte como invitado. Probá de nuevo.
        </p>
      )}

      <p className="mt-6 text-sm text-dust">
        ¿No tenés cuenta?{" "}
        <Link href="/signup" className="text-paper underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
