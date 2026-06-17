alter table public.stories
add column if not exists story_world text,
add column if not exists main_plot text,
add column if not exists plot_twist text,
add column if not exists female_protagonist_role text,
add column if not exists male_protagonist_role text,
add column if not exists male_lead_name text,
add column if not exists male_lead_profile text,
add column if not exists female_lead_name text,
add column if not exists female_lead_profile text,
add column if not exists female_route_opening_scene text,
add column if not exists male_route_opening_scene text,
add column if not exists female_route_npc_line text,
add column if not exists male_route_npc_line text,
add column if not exists female_route_pause_question text,
add column if not exists male_route_pause_question text,
add column if not exists route_common_rules text;

alter table public.story_sessions
add column if not exists route text check (
  route in ('female_protagonist', 'male_protagonist')
);
