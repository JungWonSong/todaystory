"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteStorySession,
  getUserStorySessions,
} from "@/lib/storySessions";
import type { StorySession } from "@/types/storySession";

function formatKoreanDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function getRouteLabel(route: StorySession["route"]) {
  if (route === "female_protagonist") {
    return "여성 주인공으로 이어간 장면";
  }

  if (route === "male_protagonist") {
    return "남성 주인공으로 이어간 장면";
  }

  return "이어간 장면";
}

function getSessionHref(session: StorySession) {
  const routeQuery = session.route ? `&route=${session.route}` : "";
  return `/stories/${session.story_id}?session=${session.id}${routeQuery}`;
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [sessions, setSessions] = useState<StorySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setSessionsLoading(true);
    setError("");

    try {
      const data = await getUserStorySessions(user.id);
      setSessions(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "이어간 장면을 불러오지 못했어요.",
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user) {
      void loadSessions();
    }
  }, [loadSessions, user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDelete = async (session: StorySession) => {
    if (!user) return;

    const confirmed = window.confirm("이어간 장면을 삭제할까요?");
    if (!confirmed) return;

    setError("");

    try {
      await deleteStorySession(session.id, user.id);
      await loadSessions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "이어간 장면을 삭제하지 못했어요.",
      );
    }
  };

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#151313] px-5 py-6 text-[#f6eee7] sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_14%,rgba(185,122,118,0.2),transparent_34%),linear-gradient(135deg,#151313,#211919_58%,#2f2020)]" />

      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-lg font-semibold sm:text-xl">
          오늘의 장면
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/stories"
            className="rounded-full border border-[#f3d8bf]/20 bg-white/5 px-4 py-2 text-sm text-[#f6eee7] backdrop-blur-md transition hover:bg-white/10"
          >
            이야기
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-[#c98a82] px-4 py-2 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92]"
          >
            로그아웃
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl py-16 md:py-24">
        <p className="mb-4 text-sm font-medium text-[#d2ad78]">
          당신이 이어간 이야기들
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
          내 장면
        </h1>
        <p className="mt-5 break-keep text-sm leading-7 text-[#e6d6ca]/70">
          당신이 멈춰 섰던 장면들이 여기에 조용히 남아 있어요.
        </p>

        {error ? (
          <p className="mt-8 rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-5 py-4 text-sm text-[#f3c4bf]">
            {error}
          </p>
        ) : null}

        {sessionsLoading ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="min-h-[220px] animate-pulse rounded-[30px] border border-white/10 bg-white/[0.055]"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-12 rounded-[30px] border border-white/10 bg-white/[0.055] p-7 text-center backdrop-blur-xl md:p-12">
            <div className="mx-auto mb-7 h-16 w-16 rounded-full border border-[#d2ad78]/20 bg-[#d2ad78]/10" />
            <h2 className="break-keep text-2xl font-semibold text-[#fff8f1]">
              아직 이어간 장면이 없어요.
            </h2>
            <p className="mt-4 break-keep text-base leading-7 text-[#e6d6ca]/76">
              오늘의 첫 장면을 시작해보세요.
            </p>
            <Link
              href="/stories"
              className="mt-8 inline-flex rounded-full bg-[#c98a82] px-7 py-4 text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.24)] transition hover:bg-[#d99b92]"
            >
              이야기 시작하기
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[30px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl transition hover:border-[#c98a82]/35 hover:bg-white/[0.08]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d2ad78]/12 text-3xl">
                    {session.story?.cover_emoji || "✦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#d2ad78]/12 px-3 py-1 text-xs text-[#d2ad78]">
                        {session.story?.category || "이야기"}
                      </span>
                      <span className="rounded-full bg-[#c98a82]/12 px-3 py-1 text-xs text-[#f3c4bf]">
                        {getRouteLabel(session.route)}
                      </span>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[#e6d6ca]/62">
                        {session.message_count}개의 장면 조각
                      </span>
                    </div>
                    <h2 className="mt-5 break-keep text-2xl font-semibold tracking-[-0.02em] text-[#fff8f1]">
                      {session.title || session.story?.title || "마지막 장면"}
                    </h2>
                    {session.story?.subtitle ? (
                      <p className="mt-2 break-keep text-sm leading-6 text-[#f0dfd1]/72">
                        {session.story.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[#151313]/50 p-4">
                  <p className="mb-2 text-xs text-[#d2ad78]">마지막 장면</p>
                  <p className="break-keep text-sm leading-7 text-[#e6d6ca]/78">
                    {session.last_scene_preview ||
                      "아직 이어진 장면이 많지 않아요."}
                  </p>
                </div>

                <p className="mt-4 text-xs text-[#e6d6ca]/48">
                  {formatKoreanDate(session.updated_at)} 최근 이어간 시간
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={getSessionHref(session)}
                    className="rounded-full bg-[#c98a82] px-5 py-3 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92]"
                  >
                    이어서 들어가기
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(session)}
                    className="rounded-full border border-[#c98a82]/25 px-5 py-3 text-sm text-[#f3c4bf] transition hover:bg-[#c98a82]/10"
                  >
                    삭제하기
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
