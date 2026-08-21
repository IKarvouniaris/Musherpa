-- Patrones de batería manuales: una grilla de 16 pasos (semicorcheas de un
-- compás) por voz (bombo, redoblante, hi-hat), guardada como jsonb — mismo
-- criterio que `progressions.chords`, no hace falta consultar pasos
-- individuales así que no se normaliza en filas separadas.

create table if not exists drum_patterns (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  name text check (name is null or char_length(name) <= 120),
  steps jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists drum_patterns_song_id_idx on drum_patterns (song_id);

alter table drum_patterns enable row level security;

-- Mismo patrón que progressions: dueño indirecto vía songs.
drop policy if exists "drum_patterns_select_own" on drum_patterns;
create policy "drum_patterns_select_own" on drum_patterns
  for select using (
    exists (select 1 from songs where songs.id = drum_patterns.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "drum_patterns_insert_own" on drum_patterns;
create policy "drum_patterns_insert_own" on drum_patterns
  for insert with check (
    exists (select 1 from songs where songs.id = drum_patterns.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "drum_patterns_update_own" on drum_patterns;
create policy "drum_patterns_update_own" on drum_patterns
  for update using (
    exists (select 1 from songs where songs.id = drum_patterns.song_id and songs.user_id = auth.uid())
  ) with check (
    exists (select 1 from songs where songs.id = drum_patterns.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "drum_patterns_delete_own" on drum_patterns;
create policy "drum_patterns_delete_own" on drum_patterns
  for delete using (
    exists (select 1 from songs where songs.id = drum_patterns.song_id and songs.user_id = auth.uid())
  );

-- "Automatically expose new tables" sigue apagado a propósito (ver
-- 0002_grants.sql) — el mismo GRANT manual hace falta para cada tabla nueva.
grant select, insert, update, delete on public.drum_patterns to authenticated;
