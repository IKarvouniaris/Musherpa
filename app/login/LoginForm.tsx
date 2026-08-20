"use client";

import { useActionState } from "react";
import { login, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="border-flyer bg-transparent px-3 py-2 text-paper outline-none"
        />
      </label>
      {state.error && <p className="text-sm text-rust">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[2px] bg-paper px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-ink disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
