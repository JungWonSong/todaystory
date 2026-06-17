export type AnalyticsEventName =
  | "page_view"
  | "page_leave"
  | "story_view"
  | "story_start"
  | "line_submit"
  | "signup"
  | "login";

export interface AdminMetrics {
  total_visitors: number;
  total_page_views: number;
  avg_duration_seconds: number;
  returning_visitor_rate: number;
  signup_count: number;
  login_user_count: number;
  story_start_count: number;
  line_submit_count: number;
  top_stories: Array<{
    story_id: string;
    title: string;
    count: number;
  }>;
  daily: Array<{
    date: string;
    page_views: number;
    visitors: number;
    signups: number;
    story_starts: number;
  }>;
}

export interface TrackEventParams {
  eventName: AnalyticsEventName;
  path?: string;
  userId?: string | null;
  storyId?: string | null;
  sessionRef?: string | null;
  metadata?: Record<string, unknown>;
  durationSeconds?: number;
}
