alter table public.story_sessions
add column if not exists route text
check (route in ('female_protagonist', 'male_protagonist'));

-- story_sessions insert 정책 확인
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'story_sessions'
order by policyname;

-- story_messages insert 정책 확인
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'story_messages'
order by policyname;

-- insert 정책이 없다면 참고용으로 사용할 수 있는 기본 정책
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'story_sessions'
      and policyname = 'Users can insert own story sessions'
  ) then
    create policy "Users can insert own story sessions"
    on public.story_sessions
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'story_messages'
      and policyname = 'Users can insert own story messages'
  ) then
    create policy "Users can insert own story messages"
    on public.story_messages
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end $$;
