"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200),
});

export type AuthActionState = { error: string | null; success: boolean };

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
      success: false,
    };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A guest (anonymous) session is already a real auth.uid() with songs
  // attached to it — upgrading in place with updateUser() keeps that same
  // id, so every row they created stays theirs. A fresh signUp() here would
  // create a *second*, unrelated user and orphan the guest's data.
  const { error } = user?.is_anonymous
    ? await supabase.auth.updateUser(
        {
          email: parsed.data.email,
          password: parsed.data.password,
        },
        { emailRedirectTo: `${origin}/auth/callback` }
      )
    : await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

  if (error) {
    return { error: "No pudimos crear la cuenta. Probá de nuevo.", success: false };
  }

  return { error: null, success: true };
}
