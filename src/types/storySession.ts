import type { ProtagonistRoute } from "@/types/story";

export type SceneRole = "scene" | "user" | "question";

export interface StorySession {
  id: string;
  user_id: string;
  story_id: string;
  title: string | null;
  route: ProtagonistRoute | null;
  last_scene_preview: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  story?: {
    id: string;
    title: string;
    subtitle: string | null;
    cover_emoji: string | null;
    category: string | null;
  } | null;
}

export interface StoryMessage {
  id: string;
  session_id: string;
  user_id: string;
  story_id: string;
  role: SceneRole;
  content: string;
  sort_order: number;
  created_at: string;
}

export type NewStoryMessage = {
  role: SceneRole;
  content: string;
};
