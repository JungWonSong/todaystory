export type StoryStatus = "draft" | "published";
export type ProtagonistRoute = "female_protagonist" | "male_protagonist";

export interface Story {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  category: string | null;
  cover_emoji: string | null;
  cover_image_url: string | null;
  mood: string | null;
  target_audience: string | null;
  opening_scene: string | null;
  first_question: string | null;
  story_world: string | null;
  main_plot: string | null;
  plot_twist: string | null;
  female_protagonist_role: string | null;
  male_protagonist_role: string | null;
  male_lead_name: string | null;
  male_lead_profile: string | null;
  female_lead_name: string | null;
  female_lead_profile: string | null;
  female_route_opening_scene: string | null;
  male_route_opening_scene: string | null;
  female_route_npc_line: string | null;
  male_route_npc_line: string | null;
  female_route_pause_question: string | null;
  male_route_pause_question: string | null;
  route_common_rules: string | null;
  protagonist_role?: string | null;
  npc_name?: string | null;
  npc_line?: string | null;
  pause_question?: string | null;
  scene_place?: string | null;
  scene_time?: string | null;
  main_conflict?: string | null;
  forbidden_direction?: string | null;
  status: StoryStatus;
  is_active: boolean;
  show_on_landing: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StoryFormInput {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  cover_emoji: string;
  cover_image_url: string;
  mood: string;
  target_audience: string;
  opening_scene: string;
  first_question: string;
  story_world: string;
  main_plot: string;
  plot_twist: string;
  female_protagonist_role: string;
  male_protagonist_role: string;
  male_lead_name: string;
  male_lead_profile: string;
  female_lead_name: string;
  female_lead_profile: string;
  female_route_opening_scene: string;
  male_route_opening_scene: string;
  female_route_npc_line: string;
  male_route_npc_line: string;
  female_route_pause_question: string;
  male_route_pause_question: string;
  route_common_rules: string;
  status: StoryStatus;
  is_active: boolean;
  show_on_landing: boolean;
  display_order: number;
}

export type SceneMessage =
  | { role: "scene"; content: string }
  | { role: "user"; content: string }
  | { role: "question"; content: string };

export interface StoryRouteConfig {
  route: ProtagonistRoute;
  routeLabel: string;
  protagonistRole: string;
  counterpartName: string;
  counterpartProfile: string;
  openingScene: string;
  npcLine: string;
  pauseQuestion: string;
}
