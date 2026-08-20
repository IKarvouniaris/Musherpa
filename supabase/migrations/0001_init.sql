-- MuSherpa — schema inicial + Row Level Security.
--
-- Regla de seguridad central: cada tabla tiene RLS habilitado y políticas
-- que solo permiten a un usuario ver/tocar sus propias filas. Esto se
-- cumple a nivel de Postgres, no depende de que el código de la app se
-- porte bien — aunque haya un bug en el frontend o en una Server Action,
-- la base rechaza cualquier acceso fuera de lo que le corresponde al
-- usuario autenticado (auth.uid()).

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  key_label text check (key_label is null or char_length(key_label) <= 10),
  bpm integer check (bpm is null or bpm between 20 and 300),
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists songs_user_id_idx on songs (user_id);

create table if not exists progressions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  name text check (name is null or char_length(name) <= 120),
  chords jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists progressions_song_id_idx on progressions (song_id);

create table if not exists lyrics_drafts (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  content text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists lyrics_drafts_song_id_idx on lyrics_drafts (song_id);

create table if not exists feedback_history (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  prompt_sent text not null,
  response text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_history_song_id_idx on feedback_history (song_id);

-- updated_at automático en songs
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists songs_set_updated_at on songs;
create trigger songs_set_updated_at
  before update on songs
  for each row
  execute function set_updated_at();

-- Row Level Security -------------------------------------------------------

alter table songs enable row level security;
alter table progressions enable row level security;
alter table lyrics_drafts enable row level security;
alter table feedback_history enable row level security;

-- songs: dueño directo vía user_id
drop policy if exists "songs_select_own" on songs;
create policy "songs_select_own" on songs
  for select using (auth.uid() = user_id);

drop policy if exists "songs_insert_own" on songs;
create policy "songs_insert_own" on songs
  for insert with check (auth.uid() = user_id);

drop policy if exists "songs_update_own" on songs;
create policy "songs_update_own" on songs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "songs_delete_own" on songs;
create policy "songs_delete_own" on songs
  for delete using (auth.uid() = user_id);

-- progressions / lyrics_drafts / feedback_history: dueño indirecto vía songs
drop policy if exists "progressions_select_own" on progressions;
create policy "progressions_select_own" on progressions
  for select using (
    exists (select 1 from songs where songs.id = progressions.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "progressions_insert_own" on progressions;
create policy "progressions_insert_own" on progressions
  for insert with check (
    exists (select 1 from songs where songs.id = progressions.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "progressions_update_own" on progressions;
create policy "progressions_update_own" on progressions
  for update using (
    exists (select 1 from songs where songs.id = progressions.song_id and songs.user_id = auth.uid())
  ) with check (
    exists (select 1 from songs where songs.id = progressions.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "progressions_delete_own" on progressions;
create policy "progressions_delete_own" on progressions
  for delete using (
    exists (select 1 from songs where songs.id = progressions.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "lyrics_drafts_select_own" on lyrics_drafts;
create policy "lyrics_drafts_select_own" on lyrics_drafts
  for select using (
    exists (select 1 from songs where songs.id = lyrics_drafts.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "lyrics_drafts_insert_own" on lyrics_drafts;
create policy "lyrics_drafts_insert_own" on lyrics_drafts
  for insert with check (
    exists (select 1 from songs where songs.id = lyrics_drafts.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "lyrics_drafts_update_own" on lyrics_drafts;
create policy "lyrics_drafts_update_own" on lyrics_drafts
  for update using (
    exists (select 1 from songs where songs.id = lyrics_drafts.song_id and songs.user_id = auth.uid())
  ) with check (
    exists (select 1 from songs where songs.id = lyrics_drafts.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "lyrics_drafts_delete_own" on lyrics_drafts;
create policy "lyrics_drafts_delete_own" on lyrics_drafts
  for delete using (
    exists (select 1 from songs where songs.id = lyrics_drafts.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "feedback_history_select_own" on feedback_history;
create policy "feedback_history_select_own" on feedback_history
  for select using (
    exists (select 1 from songs where songs.id = feedback_history.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "feedback_history_insert_own" on feedback_history;
create policy "feedback_history_insert_own" on feedback_history
  for insert with check (
    exists (select 1 from songs where songs.id = feedback_history.song_id and songs.user_id = auth.uid())
  );

drop policy if exists "feedback_history_delete_own" on feedback_history;
create policy "feedback_history_delete_own" on feedback_history
  for delete using (
    exists (select 1 from songs where songs.id = feedback_history.song_id and songs.user_id = auth.uid())
  );
