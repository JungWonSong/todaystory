import { supabase } from "@/lib/supabase/client";
import type { Story, StoryFormInput } from "@/types/story";

const nullableTextFields = [
  "subtitle",
  "category",
  "cover_emoji",
  "cover_image_url",
  "mood",
  "target_audience",
  "opening_scene",
  "first_question",
  "story_world",
  "main_plot",
  "plot_twist",
  "female_protagonist_role",
  "male_protagonist_role",
  "male_lead_name",
  "male_lead_profile",
  "female_lead_name",
  "female_lead_profile",
  "female_route_opening_scene",
  "male_route_opening_scene",
  "female_route_npc_line",
  "male_route_npc_line",
  "female_route_pause_question",
  "male_route_pause_question",
  "route_common_rules",
] as const;

function nullableText(value: string) {
  return value.trim() || null;
}

function normalizeStoryInput(input: StoryFormInput) {
  const normalized: Record<string, string | number | boolean | null> = {
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    is_active: input.is_active,
    show_on_landing: input.show_on_landing,
    display_order: Number(input.display_order) || 0,
  };

  nullableTextFields.forEach((field) => {
    normalized[field] = nullableText(input[field]);
  });

  return normalized;
}

function validateStoryInput(input: StoryFormInput) {
  if (!input.title.trim()) {
    throw new Error("제목을 입력해주세요.");
  }

  if (!input.description.trim()) {
    throw new Error("설명을 입력해주세요.");
  }

  if (input.status !== "draft" && input.status !== "published") {
    throw new Error("상태 값이 올바르지 않아요.");
  }
}

export async function getLandingStories() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .eq("show_on_landing", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("랜딩 이야기 목록을 불러오지 못했어요.");
  }

  return (data ?? []) as Story[];
}

export async function getPublishedStories() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("이야기 목록을 불러오지 못했어요.");
  }

  return (data ?? []) as Story[];
}

export async function getAllStoriesForAdmin() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("관리자 이야기 목록을 불러오지 못했어요.");
  }

  return (data ?? []) as Story[];
}

export async function getStoryById(id: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data as Story;
}

export async function createStory(input: StoryFormInput, userId: string) {
  validateStoryInput(input);

  const { data, error } = await supabase
    .from("stories")
    .insert({
      ...normalizeStoryInput(input),
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error("이야기를 등록하지 못했어요.");
  }

  return data as Story;
}

export async function updateStory(id: string, input: StoryFormInput) {
  validateStoryInput(input);

  const { data, error } = await supabase
    .from("stories")
    .update(normalizeStoryInput(input))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("이야기를 수정하지 못했어요.");
  }

  return data as Story;
}

export async function deleteStory(id: string) {
  const { error } = await supabase.from("stories").delete().eq("id", id);

  if (error) {
    throw new Error("이야기를 삭제하지 못했어요.");
  }
}
