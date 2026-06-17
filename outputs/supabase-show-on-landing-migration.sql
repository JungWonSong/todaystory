alter table public.stories
add column if not exists show_on_landing boolean not null default false;

update public.stories
set show_on_landing = true
where status = 'published' and is_active = true;

drop policy if exists "Anyone can read published active stories" on public.stories;

create policy "Anyone can read published active stories"
on public.stories
for select
to anon, authenticated
using (
  status = 'published'
  and is_active = true
);
