"use client";

import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";
import type { AdminMetrics, TrackEventParams } from "@/types/analytics";

const visitorStorageKey = "oj_visitor_id";
const sessionStorageKey = "oj_session_id";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

export function getOrCreateVisitorId() {
  if (!canUseBrowserStorage()) return createId();

  const stored = window.localStorage.getItem(visitorStorageKey);
  if (stored) return stored;

  const visitorId = createId();
  window.localStorage.setItem(visitorStorageKey, visitorId);
  return visitorId;
}

export function getOrCreateSessionId() {
  if (!canUseBrowserStorage()) return createId();

  const stored = window.sessionStorage.getItem(sessionStorageKey);
  if (stored) return stored;

  const sessionId = createId();
  window.sessionStorage.setItem(sessionStorageKey, sessionId);
  return sessionId;
}

export async function trackEvent({
  eventName,
  path,
  userId,
  storyId,
  sessionRef,
  metadata,
  durationSeconds,
}: TrackEventParams) {
  if (!hasSupabaseEnv || !canUseBrowserStorage()) return;

  const payload = {
    event_name: eventName,
    visitor_id: getOrCreateVisitorId(),
    session_id: getOrCreateSessionId(),
    user_id: userId ?? null,
    path: path ?? window.location.pathname,
    story_id: storyId ?? null,
    session_ref: sessionRef ?? null,
    metadata: metadata ?? {},
    duration_seconds: durationSeconds ?? null,
  };

  const { error } = await supabase.from("analytics_events").insert(payload);

  if (error) {
    console.warn("analytics event insert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      eventName,
    });
  }
}

export function trackPageView(path: string, userId?: string | null) {
  return trackEvent({
    eventName: "page_view",
    path,
    userId,
  });
}

export function trackPageLeave(
  path: string,
  userId?: string | null,
  durationSeconds?: number,
) {
  if (!durationSeconds || durationSeconds < 1) return Promise.resolve();

  return trackEvent({
    eventName: "page_leave",
    path,
    userId,
    durationSeconds: Math.round(durationSeconds),
  });
}

function normalizeAdminMetrics(value: unknown): AdminMetrics {
  const source = (value ?? {}) as Partial<AdminMetrics>;

  return {
    total_visitors: Number(source.total_visitors ?? 0),
    total_page_views: Number(source.total_page_views ?? 0),
    avg_duration_seconds: Number(source.avg_duration_seconds ?? 0),
    returning_visitor_rate: Number(source.returning_visitor_rate ?? 0),
    signup_count: Number(source.signup_count ?? 0),
    login_user_count: Number(source.login_user_count ?? 0),
    story_start_count: Number(source.story_start_count ?? 0),
    line_submit_count: Number(source.line_submit_count ?? 0),
    top_stories: Array.isArray(source.top_stories) ? source.top_stories : [],
    daily: Array.isArray(source.daily) ? source.daily : [],
  };
}

export async function getAdminMetrics(days = 7) {
  const safeDays = [7, 14, 30].includes(days) ? days : 7;
  const { data, error } = await supabase.rpc("get_admin_metrics", {
    days: safeDays,
  });

  if (error) {
    console.error("getAdminMetrics failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("운영 지표를 불러오지 못했어요.");
  }

  return normalizeAdminMetrics(data);
}

