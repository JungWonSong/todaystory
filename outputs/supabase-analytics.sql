create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- MVP 운영 편의용. 운영 배포 전에는 admin 전용 RPC/권한 테이블 기반으로 강화하세요.
drop policy if exists "Authenticated can read profiles for admin metrics" on public.profiles;
create policy "Authenticated can read profiles for admin metrics"
on public.profiles
for select
to authenticated
using (true);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  visitor_id text not null,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  path text,
  story_id uuid references public.stories(id) on delete set null,
  session_ref uuid references public.story_sessions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_idx
on public.analytics_events (event_name);

create index if not exists analytics_events_visitor_id_idx
on public.analytics_events (visitor_id);

create index if not exists analytics_events_user_id_idx
on public.analytics_events (user_id);

create index if not exists analytics_events_story_id_idx
on public.analytics_events (story_id);

create index if not exists analytics_events_path_idx
on public.analytics_events (path);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can read analytics events" on public.analytics_events;
create policy "Authenticated can read analytics events"
on public.analytics_events
for select
to authenticated
using (true);

create or replace function public.get_admin_metrics(days integer default 7)
returns jsonb
language sql
security definer
set search_path = public
as $$
with params as (
  select
    greatest(1, least(coalesce(days, 7), 90))::integer as days,
    (now() - make_interval(days => greatest(1, least(coalesce(days, 7), 90))::integer)) as start_at
),
period_events as (
  select ae.*
  from public.analytics_events ae, params p
  where ae.created_at >= p.start_at
),
period_visitors as (
  select distinct visitor_id
  from period_events
  where event_name = 'page_view'
),
returning_visitors as (
  select pv.visitor_id
  from period_visitors pv, params p
  where exists (
    select 1
    from public.analytics_events past
    where past.visitor_id = pv.visitor_id
      and past.event_name = 'page_view'
      and past.created_at < p.start_at
  )
),
daily_dates as (
  select generate_series(
    current_date - ((select days from params) - 1),
    current_date,
    interval '1 day'
  )::date as date
),
daily as (
  select
    dd.date,
    count(*) filter (where ae.event_name = 'page_view')::integer as page_views,
    count(distinct ae.visitor_id) filter (where ae.event_name = 'page_view')::integer as visitors,
    (
      select count(*)::integer
      from public.profiles p
      where p.created_at >= dd.date
        and p.created_at < dd.date + interval '1 day'
    ) as signups,
    count(*) filter (where ae.event_name = 'story_start')::integer as story_starts
  from daily_dates dd
  left join public.analytics_events ae
    on ae.created_at >= dd.date
   and ae.created_at < dd.date + interval '1 day'
  group by dd.date
  order by dd.date asc
),
top_stories as (
  select
    ae.story_id,
    coalesce(s.title, '제목 없는 이야기') as title,
    count(*)::integer as count
  from period_events ae
  left join public.stories s on s.id = ae.story_id
  where ae.event_name = 'story_start'
    and ae.story_id is not null
  group by ae.story_id, s.title
  order by count(*) desc
  limit 5
)
select jsonb_build_object(
  'total_visitors', coalesce((select count(*) from period_visitors), 0),
  'total_page_views', coalesce((select count(*) from period_events where event_name = 'page_view'), 0),
  'avg_duration_seconds', coalesce((select round(avg(duration_seconds))::integer from period_events where event_name = 'page_leave' and duration_seconds is not null), 0),
  'returning_visitor_rate',
    case
      when coalesce((select count(*) from period_visitors), 0) = 0 then 0
      else round(
        (select count(*)::numeric from returning_visitors)
        / nullif((select count(*)::numeric from period_visitors), 0),
        4
      )
    end,
  'signup_count', coalesce((select count(*) from public.profiles pr, params p where pr.created_at >= p.start_at), 0),
  'login_user_count', coalesce((select count(distinct user_id) from period_events where user_id is not null), 0),
  'story_start_count', coalesce((select count(*) from period_events where event_name = 'story_start'), 0),
  'line_submit_count', coalesce((select count(*) from period_events where event_name = 'line_submit'), 0),
  'top_stories', coalesce((select jsonb_agg(to_jsonb(top_stories)) from top_stories), '[]'::jsonb),
  'daily', coalesce((select jsonb_agg(to_jsonb(daily)) from daily), '[]'::jsonb)
);
$$;

grant execute on function public.get_admin_metrics(integer) to authenticated;

-- 운영 배포 전 권장:
-- 1. admin_profiles 같은 별도 테이블을 만들고 관리자 user_id만 저장
-- 2. get_admin_metrics 내부에서 auth.uid()가 admin_profiles에 있는지 검사
-- 3. analytics_events/profiles select 정책은 관리자 전용 RPC만 통하도록 축소
