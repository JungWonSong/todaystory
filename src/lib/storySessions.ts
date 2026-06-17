import { supabase } from "@/lib/supabase/client";
import type { ProtagonistRoute } from "@/types/story";
import type {
  NewStoryMessage,
  SceneRole,
  StoryMessage,
  StorySession,
} from "@/types/storySession";

const validRoles: SceneRole[] = ["scene", "user", "question"];

function isValidRole(role: string): role is SceneRole {
  return validRoles.includes(role as SceneRole);
}

function safeRoute(route?: ProtagonistRoute | null): ProtagonistRoute {
  return route === "male_protagonist"
    ? "male_protagonist"
    : "female_protagonist";
}

function normalizeMessages(messages: NewStoryMessage[] = []) {
  return messages
    .filter((message) => isValidRole(message.role))
    .map((message) => ({
      role: message.role,
      content: message.content?.trim() ?? "",
    }))
    .filter((message) => message.content.length > 0);
}

function previewFromMessages(messages: NewStoryMessage[]) {
  const validMessages = normalizeMessages(messages);
  const last =
    [...validMessages].reverse().find((message) => message.role === "scene") ??
    [...validMessages].reverse().find((message) => message.role === "user") ??
    validMessages[validMessages.length - 1];

  const content = last?.content.trim() ?? "";
  return content.length > 120 ? `${content.slice(0, 120)}...` : content;
}

function logSupabaseError(
  label: string,
  error: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  },
  payload: Record<string, unknown>,
) {
  console.error(label, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    ...payload,
  });
}

export async function createStorySession(params: {
  userId: string;
  storyId: string;
  title?: string | null;
  route?: ProtagonistRoute | null;
  initialMessages?: NewStoryMessage[];
}) {
  if (!params.userId) {
    throw new Error("로그인 정보가 없어요.");
  }

  if (!params.storyId) {
    throw new Error("이야기 정보를 찾지 못했어요.");
  }

  const validInitialMessages = normalizeMessages(params.initialMessages);
  const sessionPayload = {
    user_id: params.userId,
    story_id: params.storyId,
    title: params.title?.trim() || "이름 없는 장면",
    route: safeRoute(params.route),
    last_scene_preview: previewFromMessages(validInitialMessages),
    message_count: validInitialMessages.length,
  };

  const { data, error } = await supabase
    .from("story_sessions")
    .insert(sessionPayload)
    .select("*")
    .single();

  if (error) {
    logSupabaseError("createStorySession session insert error:", error, {
      payload: sessionPayload,
    });
    throw new Error("새 장면을 저장하지 못했어요.");
  }

  const session = data as StorySession;

  if (validInitialMessages.length === 0) {
    return session;
  }

  const messagesPayload = validInitialMessages.map((message, index) => ({
    session_id: session.id,
    user_id: params.userId,
    story_id: params.storyId,
    role: message.role,
    content: message.content,
    sort_order: index,
  }));

  const { error: messagesError } = await supabase
    .from("story_messages")
    .insert(messagesPayload);

  if (messagesError) {
    logSupabaseError(
      "createStorySession messages insert error:",
      messagesError,
      { messagesPayload },
    );

    const { error: cleanupError } = await supabase
      .from("story_sessions")
      .delete()
      .eq("id", session.id)
      .eq("user_id", params.userId);

    if (cleanupError) {
      logSupabaseError(
        "createStorySession cleanup session delete error:",
        cleanupError,
        { sessionId: session.id, userId: params.userId },
      );
    }

    throw new Error("새 장면을 저장하지 못했어요.");
  }

  return {
    ...session,
    route: sessionPayload.route,
    message_count: validInitialMessages.length,
    last_scene_preview: previewFromMessages(validInitialMessages),
  };
}

export async function getUserStorySessions(userId: string) {
  const { data, error } = await supabase
    .from("story_sessions")
    .select(
      `
      *,
      story:stories (
        id,
        title,
        subtitle,
        cover_emoji,
        category
      )
    `,
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    logSupabaseError("getUserStorySessions error:", error, { userId });
    throw new Error("이어간 장면을 불러오지 못했어요.");
  }

  return (data ?? []) as StorySession[];
}

export async function getStorySessionById(sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from("story_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    logSupabaseError("getStorySessionById error:", error, {
      sessionId,
      userId,
    });
    throw new Error("저장된 장면을 찾지 못했어요.");
  }

  return data as StorySession;
}

export async function getStoryMessages(sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from("story_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    logSupabaseError("getStoryMessages error:", error, { sessionId, userId });
    throw new Error("이어간 장면을 불러오지 못했어요.");
  }

  return (data ?? []) as StoryMessage[];
}

export async function addStoryMessages(params: {
  sessionId: string;
  userId: string;
  storyId: string;
  messages: NewStoryMessage[];
}) {
  const validMessages = normalizeMessages(params.messages);
  if (validMessages.length === 0) return;

  const { count, error: countError } = await supabase
    .from("story_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", params.sessionId)
    .eq("user_id", params.userId);

  if (countError) {
    logSupabaseError("addStoryMessages count error:", countError, {
      sessionId: params.sessionId,
      userId: params.userId,
    });
    throw new Error("장면 저장 상태를 확인하지 못했어요.");
  }

  const startOrder = count ?? 0;
  const messagesPayload = validMessages.map((message, index) => ({
    session_id: params.sessionId,
    user_id: params.userId,
    story_id: params.storyId,
    role: message.role,
    content: message.content,
    sort_order: startOrder + index,
  }));

  const { error: insertError } = await supabase
    .from("story_messages")
    .insert(messagesPayload);

  if (insertError) {
    logSupabaseError("addStoryMessages insert error:", insertError, {
      messagesPayload,
    });
    throw new Error("새 장면을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
  }

  const newCount = startOrder + validMessages.length;
  const updatePayload = {
    message_count: newCount,
    last_scene_preview: previewFromMessages(validMessages),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("story_sessions")
    .update(updatePayload)
    .eq("id", params.sessionId)
    .eq("user_id", params.userId);

  if (updateError) {
    logSupabaseError("addStoryMessages update session error:", updateError, {
      updatePayload,
      sessionId: params.sessionId,
      userId: params.userId,
    });
    throw new Error("마지막 장면 정보를 갱신하지 못했어요.");
  }
}

export async function deleteStorySession(sessionId: string, userId: string) {
  const { error } = await supabase
    .from("story_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    logSupabaseError("deleteStorySession error:", error, { sessionId, userId });
    throw new Error("이어간 장면을 삭제하지 못했어요.");
  }
}
