create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text not null,
  category text,
  cover_emoji text,
  cover_image_url text,
  mood text,
  target_audience text,
  opening_scene text,
  first_question text,
  story_world text,
  main_plot text,
  plot_twist text,
  female_protagonist_role text,
  male_protagonist_role text,
  male_lead_name text,
  male_lead_profile text,
  female_lead_name text,
  female_lead_profile text,
  female_route_opening_scene text,
  male_route_opening_scene text,
  female_route_npc_line text,
  male_route_npc_line text,
  female_route_pause_question text,
  male_route_pause_question text,
  route_common_rules text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_active boolean not null default false,
  show_on_landing boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_set_updated_at on public.stories;

create trigger stories_set_updated_at
before update on public.stories
for each row
execute function public.set_updated_at();

alter table public.stories enable row level security;

alter table public.stories
add column if not exists show_on_landing boolean not null default false;

update public.stories
set show_on_landing = true
where status = 'published' and is_active = true;

drop policy if exists "Anyone can read published active stories" on public.stories;
drop policy if exists "Authenticated users can read stories for admin" on public.stories;
drop policy if exists "Authenticated users can insert stories" on public.stories;
drop policy if exists "Authenticated users can update stories" on public.stories;
drop policy if exists "Authenticated users can delete stories" on public.stories;

create policy "Anyone can read published active stories"
on public.stories
for select
to anon, authenticated
using (status = 'published' and is_active = true);

create policy "Authenticated users can read stories for admin"
on public.stories
for select
to authenticated
using (true);

create policy "Authenticated users can insert stories"
on public.stories
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Authenticated users can update stories"
on public.stories
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stories"
on public.stories
for delete
to authenticated
using (true);

comment on table public.stories is
'MVP에서는 클라이언트의 NEXT_PUBLIC_ADMIN_EMAIL 체크로 관리자 UI 접근을 제한합니다. 운영 배포 전에는 admin_profiles 테이블 기반 RLS로 insert/update/delete 권한을 강화해야 합니다.';
