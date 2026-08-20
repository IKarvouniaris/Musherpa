-- Otorga el permiso de base (GRANT) que "Automatically expose new tables"
-- habría dado automáticamente si hubiera estado tildado al crear el
-- proyecto. Lo dejamos apagado a propósito, así que este paso es manual:
-- ahora el rol `authenticated` puede operar sobre las 4 tablas, pero
-- QUÉ FILAS puede tocar sigue estando 100% acotado por las políticas de
-- RLS de 0001_init.sql (auth.uid() = user_id, o el song_id le pertenece).
--
-- A propósito NO se le otorga nada al rol `anon` (usuarios sin ningún tipo
-- de sesión, ni siquiera anónima) — solo `authenticated`, que es el rol
-- que usan tanto las cuentas registradas como las sesiones de invitado
-- (signInAnonymously).

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.songs to authenticated;
grant select, insert, update, delete on public.progressions to authenticated;
grant select, insert, update, delete on public.lyrics_drafts to authenticated;
grant select, insert, update, delete on public.feedback_history to authenticated;
