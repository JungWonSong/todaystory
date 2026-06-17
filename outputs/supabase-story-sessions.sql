create table if not exists public.story_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  title text,
  route text check (route in ('female_protagonist', 'male_protagonist')),
  last_scene_preview text,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.story_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  role text not null check (role in ('scene', 'user', 'question')),
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists story_sessions_user_updated_idx
on public.story_sessions (user_id, updated_at desc);

create index if not exists story_messages_session_order_idx
on public.story_messages (session_id, sort_order asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists story_sessions_set_updated_at on public.story_sessions;

create trigger story_sessions_set_updated_at
before update on public.story_sessions
for each row
execute function public.set_updated_at();

alter table public.story_sessions enable row level security;
alter table public.story_messages enable row level security;

drop policy if exists "Users can read own story sessions" on public.story_sessions;
drop policy if exists "Users can insert own story sessions" on public.story_sessions;
drop policy if exists "Users can update own story sessions" on public.story_sessions;
drop policy if exists "Users can delete own story sessions" on public.story_sessions;

create policy "Users can read own story sessions"
on public.story_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own story sessions"
on public.story_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own story sessions"
on public.story_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own story sessions"
on public.story_sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own story messages" on public.story_messages;
drop policy if exists "Users can insert own story messages" on public.story_messages;
drop policy if exists "Users can update own story messages" on public.story_messages;
drop policy if exists "Users can delete own story messages" on public.story_messages;

create policy "Users can read own story messages"
on public.story_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own story messages"
on public.story_messages
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own story messages"
on public.story_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own story messages"
on public.story_messages
for delete
to authenticated
using (auth.uid() = user_id);
