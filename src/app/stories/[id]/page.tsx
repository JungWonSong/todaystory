"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { getStoryById } from "@/lib/stories";
import {
  addStoryMessages,
  createStorySession,
  getStoryMessages,
  getStorySessionById,
} from "@/lib/storySessions";
import type {
  ProtagonistRoute,
  SceneMessage,
  Story,
  StoryRouteConfig,
} from "@/types/story";

const defaultRoute: ProtagonistRoute = "female_protagonist";
const defaultQuestion = "나는 뭐라고 말할까?";
const defaultConflict =
  "이 장면에서 당신은 오래 미뤄둔 말을 마주하게 됩니다.";
const defaultPlace = "조용한 장면 안";
const defaultTime = "어느 하루의 끝";

const suggestionButtons = [
  { label: "조심스럽게", value: "그 말이 조금 서운했어." },
  { label: "솔직하게", value: "나도 오늘 많이 힘들었어." },
  { label: "침묵하기", value: "...아무 말도 할 수 없었다." },
];

function isRoute(value: string | null): value is ProtagonistRoute {
  return value === "female_protagonist" || value === "male_protagonist";
}

function clean(value: string | null | undefined) {
  return value?.trim() || "";
}

function normalizeQuote(value: string) {
  return value.trim().replace(/^["“”']+|["“”']+$/g, "");
}

function includesLine(scene: string, line: string) {
  const normalizedScene = scene.replace(/[“”"'\s]/g, "");
  const normalizedLine = normalizeQuote(line).replace(/[“”"'\s]/g, "");
  return Boolean(normalizedLine) && normalizedScene.includes(normalizedLine);
}

function isNonEmptySceneMessage(
  message: SceneMessage | null,
): message is SceneMessage {
  return Boolean(message && message.content.trim().length > 0);
}

function getRouteConfig(
  story: Story,
  route: ProtagonistRoute,
): StoryRouteConfig {
  if (route === "male_protagonist") {
    return {
      route,
      routeLabel: "남성 주인공",
      protagonistRole:
        clean(story.male_protagonist_role) ||
        clean(story.protagonist_role) ||
        "이야기의 주인공",
      counterpartName:
        clean(story.female_lead_name) || clean(story.npc_name) || "상대 인물",
      counterpartProfile: clean(story.female_lead_profile),
      openingScene:
        clean(story.male_route_opening_scene) || clean(story.opening_scene),
      npcLine: clean(story.male_route_npc_line) || clean(story.npc_line),
      pauseQuestion:
        clean(story.male_route_pause_question) ||
        clean(story.pause_question) ||
        clean(story.first_question) ||
        defaultQuestion,
    };
  }

  return {
    route: "female_protagonist",
    routeLabel: "여성 주인공",
    protagonistRole:
      clean(story.female_protagonist_role) ||
      clean(story.protagonist_role) ||
      "이야기의 주인공",
    counterpartName:
      clean(story.male_lead_name) || clean(story.npc_name) || "상대 인물",
    counterpartProfile: clean(story.male_lead_profile),
    openingScene:
      clean(story.female_route_opening_scene) || clean(story.opening_scene),
    npcLine: clean(story.female_route_npc_line) || clean(story.npc_line),
    pauseQuestion:
      clean(story.female_route_pause_question) ||
      clean(story.pause_question) ||
      clean(story.first_question) ||
      defaultQuestion,
  };
}

function buildFallbackScene(story: Story, routeConfig: StoryRouteConfig) {
  const sceneTime = clean(story.scene_time) || defaultTime;
  const scenePlace = clean(story.scene_place) || defaultPlace;
  const conflict = clean(story.main_conflict) || defaultConflict;

  return [
    sceneTime,
    `${scenePlace}에서, 나는 ${routeConfig.protagonistRole}으로 이 장면 앞에 서 있었다.`,
    conflict,
  ].join("\n\n");
}

function buildInitialScene(story: Story, routeConfig: StoryRouteConfig) {
  let scene =
    routeConfig.openingScene ||
    clean(story.opening_scene) ||
    buildFallbackScene(story, routeConfig);

  if (routeConfig.npcLine && !includesLine(scene, routeConfig.npcLine)) {
    scene += `\n\n그때, ${routeConfig.counterpartName}이 나를 바라보며 말했다.\n“${normalizeQuote(
      routeConfig.npcLine,
    )}”`;
  }

  return scene;
}

function buildInitialMessages(
  story: Story,
  routeConfig: StoryRouteConfig,
): SceneMessage[] {
  const initialMessages: Array<SceneMessage | null> = [
    { role: "scene", content: buildInitialScene(story, routeConfig) },
    { role: "question", content: routeConfig.pauseQuestion || defaultQuestion },
  ];

  return initialMessages.filter(isNonEmptySceneMessage);
}

function toSceneMessages(
  records: { role: string; content: string | null }[],
): SceneMessage[] {
  return records
    .filter(
      (record): record is SceneMessage =>
        (record.role === "scene" ||
          record.role === "user" ||
          record.role === "question") &&
        Boolean(record.content?.trim()),
    )
    .map((record) => ({
      role: record.role,
      content: record.content.trim(),
    }));
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151313]/42 px-4 py-3">
      <p className="text-[11px] font-medium text-[#d2ad78]">{label}</p>
      <p className="mt-1 break-keep text-sm leading-6 text-[#f8eee6]/86">
        {value}
      </p>
    </div>
  );
}

function StoryPiece({ message }: { message: SceneMessage }) {
  if (message.role === "user") {
    return (
      <section className="border-y border-[#d2ad78]/18 py-6">
        <p className="mb-3 text-xs font-medium text-[#d2ad78]">
          내가 쓴 대사
        </p>
        <blockquote className="break-keep text-xl font-medium leading-[1.75] tracking-[-0.02em] text-[#fff8f1]">
          “{message.content}”
        </blockquote>
      </section>
    );
  }

  if (message.role === "question") {
    return (
      <section className="rounded-3xl border border-[#d2ad78]/20 bg-[#d2ad78]/10 p-5">
        <p className="mb-3 text-xs font-medium text-[#d2ad78]">
          장면이 멈춘 곳
        </p>
        <p className="break-keep text-lg leading-8 text-[#f4e1c0]">
          {message.content}
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className="break-keep whitespace-pre-line text-[17px] leading-[2.05] tracking-[-0.015em] text-[#f4e7dc]/90">
        {message.content}
      </p>
    </section>
  );
}

export default function StoryPlayPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [storyLoading, setStoryLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [selectedRoute, setSelectedRoute] =
    useState<ProtagonistRoute | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SceneMessage[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const viewedStoryRef = useRef<string | null>(null);

  const storyId = params?.id;
  const sessionIdParam = searchParams.get("session");
  const routeParam = searchParams.get("route");
  const safeRouteFromUrl = isRoute(routeParam) ? routeParam : null;
  const routeToUse = selectedRoute || defaultRoute;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!storyId) return;

    let alive = true;

    async function loadStory() {
      setStoryLoading(true);
      setError("");
      setSaveError("");
      setStory(null);
      setMessages([]);
      setSessionId(null);
      setStarted(false);

      try {
        const loadedStory = await getStoryById(storyId);
        if (!alive) return;

        if (!loadedStory) {
          setStory(null);
          setError("열 수 없는 장면이에요.");
          return;
        }

        setStory(loadedStory);
      } catch (error) {
        console.error("load story failed:", error);
        if (!alive) return;
        setStory(null);
        setError("장면을 불러오지 못했어요.");
      } finally {
        if (alive) setStoryLoading(false);
      }
    }

    void loadStory();

    return () => {
      alive = false;
    };
  }, [authLoading, router, storyId, user]);

  useEffect(() => {
    setSelectedRoute(safeRouteFromUrl);
  }, [safeRouteFromUrl, storyId]);

  useEffect(() => {
    if (!sessionIdParam) {
      setMessages([]);
      setSessionId(null);
      setStarted(false);
      return;
    }

    if (!user || !story || storyLoading) return;

    let alive = true;
    const currentSessionId = sessionIdParam;
    const currentUserId = user.id;
    const currentStory = story;

    async function loadSession() {
      setError("");
      setSaveError("");

      try {
        const session = await getStorySessionById(
          currentSessionId,
          currentUserId,
        );
        const savedPieces = await getStoryMessages(
          currentSessionId,
          currentUserId,
        );

        if (!alive) return;

        if (session.story_id !== currentStory.id) {
          setError("이 이야기와 연결된 장면을 찾지 못했어요.");
          setSessionId(null);
          setMessages([]);
          setStarted(false);
          return;
        }

        setSessionId(session.id);
        setSelectedRoute(session.route ?? safeRouteFromUrl);
        setMessages(toSceneMessages(savedPieces));
        setStarted(savedPieces.length > 0);
      } catch (error) {
        console.error("load story session failed:", error);
        if (!alive) return;
        setError(
          error instanceof Error
            ? error.message
            : "저장된 장면을 불러오지 못했어요.",
        );
        setSessionId(null);
        setMessages([]);
        setStarted(false);
      }
    }

    void loadSession();

    return () => {
      alive = false;
    };
  }, [safeRouteFromUrl, sessionIdParam, story, storyId, storyLoading, user]);

  useEffect(() => {
    // 배포 전 제거 가능: 클라이언트 라우팅 상태 꼬임 확인용 로그입니다.
    console.log("story page state:", {
      storyId,
      sessionId: sessionIdParam,
      routeParam,
      authLoading,
      hasUser: Boolean(user),
      storyLoading,
      hasStory: Boolean(story),
      selectedRoute,
      started,
    });
  }, [
    authLoading,
    routeParam,
    selectedRoute,
    sessionIdParam,
    started,
    story,
    storyId,
    storyLoading,
    user,
  ]);

  const routeConfig = useMemo(() => {
    if (!story) return null;
    return getRouteConfig(story, routeToUse);
  }, [routeToUse, story]);

  const openingMessages = useMemo<SceneMessage[]>(() => {
    if (!story || !routeConfig) return [];
    return buildInitialMessages(story, routeConfig);
  }, [routeConfig, story]);

  useEffect(() => {
    if (!story || viewedStoryRef.current === story.id) return;

    viewedStoryRef.current = story.id;
    void trackEvent({
      eventName: "story_view",
      path: `/stories/${story.id}`,
      userId: user?.id,
      storyId: story.id,
      metadata: {
        story_title: story.title,
      },
    });
  }, [story, user?.id]);

  const chooseRoute = (route: ProtagonistRoute) => {
    setSelectedRoute(route);
    if (!storyId) return;
    router.replace(`/stories/${storyId}?route=${route}`);
  };

  const startStory = async () => {
    if (!story || !user || !routeConfig || saving) return;

    const routeConfigToUse = getRouteConfig(story, routeToUse);
    const initialMessages = buildInitialMessages(story, routeConfigToUse);

    // 배포 전 제거 가능: Supabase 저장 실패 원인을 확인하기 위한 임시 로그입니다.
    console.log("start scene payload:", {
      userId: user?.id,
      storyId: story?.id,
      selectedRoute,
      routeToUse,
      routeConfig: routeConfigToUse,
      openingScene: routeConfigToUse.openingScene || story.opening_scene,
      npcLine: routeConfigToUse.npcLine,
      pauseQuestion: routeConfigToUse.pauseQuestion,
    });

    setSaving(true);
    setError("");
    setSaveError("");

    try {
      const session = await createStorySession({
        userId: user.id,
        storyId: story.id,
        title: story.title,
        route: routeToUse,
        initialMessages,
      });

      void trackEvent({
        eventName: "story_start",
        path: `/stories/${story.id}`,
        userId: user.id,
        storyId: story.id,
        sessionRef: session.id,
        metadata: {
          route: routeToUse,
          story_title: story.title,
        },
      });

      setSessionId(session.id);
      setMessages(initialMessages);
      setStarted(true);
      setSelectedRoute(routeToUse);
      router.replace(`/stories/${story.id}?session=${session.id}&route=${routeToUse}`);
    } catch (error) {
      console.error("handleStartScene error:", error);
      setSaveError("새 장면을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const submitInput = async () => {
    const trimmed = input.trim();

    if (!story || !user || !routeConfig || submitting) return;

    if (!sessionId) {
      setError("저장된 장면을 찾지 못했어요. 새 장면으로 다시 시작해주세요.");
      return;
    }

    if (!trimmed) {
      setError("주인공의 대사를 적어주세요.");
      return;
    }

    if (trimmed.length > 300) {
      setError("조금 더 짧게 적어볼까요? 300자 이내로 적어주세요.");
      return;
    }

    setError("");
    setSaveError("");
    setSubmitting(true);

    const userLine: SceneMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userLine];

    setMessages(nextMessages);
    setInput("");

    try {
      await addStoryMessages({
        sessionId,
        userId: user.id,
        storyId: story.id,
        messages: [userLine],
      });

      void trackEvent({
        eventName: "line_submit",
        path: `/stories/${story.id}`,
        userId: user.id,
        storyId: story.id,
        sessionRef: sessionId,
        metadata: {
          route: routeConfig.route,
          story_title: story.title,
        },
      });
    } catch (error) {
      console.error("save user line error:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "내가 쓴 대사를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/story/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          story: {
            id: story.id,
            title: story.title,
            description: story.description,
            category: story.category,
            mood: story.mood,
            story_world: story.story_world,
            main_plot: story.main_plot,
            main_conflict: story.main_conflict,
            plot_twist: story.plot_twist,
            route_common_rules: story.route_common_rules,
            forbidden_direction: story.forbidden_direction,
            opening_scene: routeConfig.openingScene,
            first_question: routeConfig.pauseQuestion,
          },
          routeConfig,
          messages: nextMessages.slice(-6),
          userInput: trimmed,
        }),
      });

      const data = (await response.json()) as {
        scene?: string;
        question?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error);
      }

      const nextScenePieces: SceneMessage[] = [
        {
          role: "scene",
          content:
            data.scene ||
            "장면을 이어가지 못했어요. 다시 한 번 대사를 넣어볼까요?",
        },
        { role: "question", content: data.question || defaultQuestion },
      ];

      setMessages((current) => [...current, ...nextScenePieces]);

      try {
        await addStoryMessages({
          sessionId,
          userId: user.id,
          storyId: story.id,
          messages: nextScenePieces,
        });
      } catch (error) {
        console.error("save continued scene error:", error);
        setSaveError(
          error instanceof Error
            ? error.message
            : "이어지는 장면을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      }
    } catch (error) {
      console.error("continue story error:", error);
      setError("장면을 이어가지 못했어요. 다시 한 번 말해볼까요?");
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitInput();
    }
  };

  if (authLoading || (!authLoading && !user) || storyLoading || !storyId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151313] px-5 text-[#f6eee7]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-6 py-5 text-sm text-[#e6d6ca]/80 backdrop-blur-xl">
          첫 장면을 불러오고 있어요...
        </div>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151313] px-5 text-[#f6eee7]">
        <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.065] p-7 text-center backdrop-blur-2xl">
          <p className="text-sm font-medium text-[#d2ad78]">오늘의 장면</p>
          <h1 className="mt-5 break-keep text-3xl font-semibold tracking-[-0.03em]">
            {error || "열 수 없는 장면이에요."}
          </h1>
          <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/75">
            공개되지 않았거나 잠시 닫혀 있는 이야기일 수 있어요.
          </p>
          <Link
            href="/stories"
            className="mt-8 inline-flex rounded-full bg-[#c98a82] px-6 py-3 text-sm font-semibold text-[#1d1414]"
          >
            다른 이야기 보러가기
          </Link>
        </section>
      </main>
    );
  }

  const activeRouteConfig = routeConfig ?? getRouteConfig(story, defaultRoute);
  const scenePlace = clean(story.scene_place) || defaultPlace;
  const sceneTime = clean(story.scene_time) || defaultTime;
  const mainConflict = clean(story.main_conflict) || defaultConflict;
  const storyIntro = clean(story.subtitle) || clean(story.description);

  if (!started) {
    const femaleConfig = getRouteConfig(story, "female_protagonist");
    const maleConfig = getRouteConfig(story, "male_protagonist");

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#151313] px-5 py-6 text-[#f6eee7] sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_14%,rgba(185,122,118,0.2),transparent_34%),linear-gradient(135deg,#151313,#211919_58%,#2f2020)]" />
        <header className="mx-auto flex max-w-[820px] items-center justify-between">
          <Link href="/stories" className="text-sm text-[#d2ad78]">
            다른 이야기
          </Link>
          <Link href="/" className="text-sm text-[#e6d6ca]/70">
            오늘의 장면
          </Link>
        </header>

        <section className="mx-auto max-w-[820px] py-12 md:py-20">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.065] p-7 backdrop-blur-2xl md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d2ad78]/12 text-4xl">
                {story.cover_emoji || "✦"}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#d2ad78]/12 px-3 py-1 text-xs text-[#d2ad78]">
                  {story.category || "이야기"}
                </span>
                <span className="rounded-full bg-[#c98a82]/12 px-3 py-1 text-xs text-[#f0b8b2]">
                  {activeRouteConfig.routeLabel}으로 들어갈 장면
                </span>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[#e6d6ca]/64">
                  상대 인물: {activeRouteConfig.counterpartName}
                </span>
              </div>
            </div>

            <p className="mt-8 text-sm font-medium text-[#d2ad78]">
              오늘의 장면
            </p>
            <h1 className="mt-3 break-keep text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
              {story.title}
            </h1>
            {storyIntro ? (
              <p className="mt-5 break-keep text-lg leading-8 text-[#f0dfd1]/85">
                {storyIntro}
              </p>
            ) : null}

            <div className="mt-9">
              <p className="mb-4 break-keep text-xl font-semibold text-[#fff8f1]">
                어떤 주인공으로 들어갈까요?
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    route: "female_protagonist" as const,
                    title: "여성 주인공으로 들어가기",
                    config: femaleConfig,
                  },
                  {
                    route: "male_protagonist" as const,
                    title: "남성 주인공으로 들어가기",
                    config: maleConfig,
                  },
                ].map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => chooseRoute(item.route)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      routeToUse === item.route
                        ? "border-[#c98a82]/70 bg-[#c98a82]/12"
                        : "border-white/10 bg-[#151313]/45 hover:bg-white/[0.07]"
                    }`}
                  >
                    <p className="text-base font-semibold text-[#fff8f1]">
                      {item.title}
                    </p>
                    <p className="mt-3 break-keep text-sm leading-6 text-[#e6d6ca]/76">
                      {item.config.protagonistRole}
                    </p>
                    <p className="mt-4 text-xs text-[#d2ad78]">상대 인물</p>
                    <p className="mt-1 break-keep text-sm leading-6 text-[#e6d6ca]/68">
                      {item.config.counterpartName}
                    </p>
                    {item.config.counterpartProfile ? (
                      <p className="mt-2 line-clamp-3 break-keep text-xs leading-5 text-[#e6d6ca]/52">
                        {item.config.counterpartProfile}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <section className="mt-9 rounded-[28px] border border-[#f1d4bd]/14 bg-[#151313]/55 p-6">
              <p className="text-sm font-medium text-[#d2ad78]">
                당신이 들어갈 장면
              </p>
              <p className="mt-4 break-keep text-lg leading-8 text-[#fff8f1]">
                당신은 이 장면에서 {activeRouteConfig.protagonistRole}으로
                들어갑니다.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoPill label="장소" value={scenePlace} />
                <InfoPill label="시간" value={sceneTime} />
                <InfoPill
                  label="상대 인물"
                  value={`${activeRouteConfig.counterpartName}${
                    activeRouteConfig.counterpartProfile
                      ? ` · ${activeRouteConfig.counterpartProfile}`
                      : ""
                  }`}
                />
                <InfoPill label="이야기의 결" value={mainConflict} />
              </div>
            </section>

            {saveError ? (
              <p className="mt-6 rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-4 py-3 text-sm text-[#f3c4bf]">
                {saveError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void startStory()}
              disabled={saving}
              className="mt-9 w-full rounded-full bg-[#c98a82] px-7 py-4 text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.26)] transition hover:bg-[#d99b92] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "장면을 열고 있어요..." : "장면 속으로 들어가기"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#151313] px-5 pt-6 text-[#f6eee7] sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_14%,rgba(185,122,118,0.18),transparent_34%),linear-gradient(135deg,#151313,#211919_58%,#2f2020)]" />

      <header className="mx-auto flex max-w-[760px] items-center justify-between gap-4">
        <Link href="/stories" className="text-sm text-[#d2ad78]">
          뒤로가기
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setStarted(false);
              setSessionId(null);
              setMessages([]);
              setInput("");
              setError("");
              setSaveError("");
              router.replace(`/stories/${story.id}`);
            }}
            className="text-xs text-[#f4e7d4]/45 transition hover:text-[#f4e7d4]"
          >
            새 장면
          </button>
          <Link href="/" className="text-sm text-[#e6d6ca]/70">
            오늘의 장면
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[760px] pb-8 pt-10">
        {error ? (
          <p className="mb-5 rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-4 py-3 text-sm text-[#f3c4bf]">
            {error}
          </p>
        ) : null}
        {saveError ? (
          <p className="mb-5 rounded-2xl border border-[#d2ad78]/25 bg-[#d2ad78]/10 px-4 py-3 text-sm text-[#f4e1c0]">
            {saveError}
          </p>
        ) : null}

        <section className="mb-6 rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
          <p className="text-xs font-medium text-[#d2ad78]">
            이야기 속의 나
          </p>
          <h1 className="mt-3 break-keep text-3xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-5xl">
            {story.title}
          </h1>
          {storyIntro ? (
            <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/72">
              {storyIntro}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoPill
              label="선택한 역할"
              value={`${activeRouteConfig.routeLabel} · ${activeRouteConfig.protagonistRole}`}
            />
            <InfoPill
              label="상대 인물"
              value={`${activeRouteConfig.counterpartName}${
                activeRouteConfig.counterpartProfile
                  ? ` · ${activeRouteConfig.counterpartProfile}`
                  : ""
              }`}
            />
            <InfoPill label="장면의 갈등" value={mainConflict} />
          </div>
        </section>

        <article className="rounded-[34px] border border-white/10 bg-[#211b1a]/72 px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:px-10 md:py-11">
          <div className="mb-10 border-b border-white/10 pb-6">
            <p className="mb-2 text-xs font-medium text-[#d2ad78]">
              소설 본문
            </p>
            <p className="break-keep text-sm leading-7 text-[#e6d6ca]/68">
              {sceneTime} · {scenePlace}
            </p>
          </div>

          <div className="space-y-8 pb-28 sm:pb-20">
            {messages.map((message, index) => (
              <StoryPiece key={`${message.role}-${index}`} message={message} />
            ))}

            {submitting ? (
              <section className="animate-pulse rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-sm text-[#e6d6ca]/70">
                <span>장면이 이어지고 있어요...</span>
                <span className="ml-1 inline-flex gap-1 align-middle">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d2ad78]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d2ad78]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d2ad78]" />
                </span>
              </section>
            ) : null}
          </div>
        </article>
      </section>

      <section className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ead7bd]/10 bg-[#120f0f]/90 px-5 py-3 backdrop-blur-xl sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-[760px] sm:-translate-x-1/2 sm:rounded-3xl sm:border sm:px-5">
        <div>
          <p className="text-sm font-medium text-[#f4e7d4]/80">내 대사</p>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestionButtons.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                disabled={submitting}
                onClick={() => setInput(suggestion.value)}
                className="shrink-0 rounded-full border border-[#ead7bd]/15 bg-white/5 px-3 py-1.5 text-xs text-[#f4e7d4]/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion.label}
              </button>
            ))}
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            maxLength={300}
            placeholder="이 장면에서 할 말을 적어보세요."
            className="min-h-[72px] max-h-[120px] w-full resize-none rounded-2xl border border-[#ead7bd]/10 bg-[#1d1717]/90 px-4 py-3 text-[15px] leading-relaxed text-[#fff7ea] outline-none transition placeholder:text-[#f4e7d4]/35 focus:border-[#d9978f]/50 disabled:opacity-60"
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-[#e6d6ca]/45">{input.length}/300</p>
            <button
              type="button"
              onClick={() => void submitInput()}
              disabled={submitting}
              className="rounded-full bg-[#c98a82] px-5 py-2 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92] disabled:cursor-not-allowed disabled:opacity-60"
            >
              대사 넣기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
