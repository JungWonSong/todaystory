"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { goHomeWithReload, HomeLink } from "@/components/HomeLink";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { getPublishedStories } from "@/lib/stories";
import type { Story } from "@/types/story";

export default function StoriesPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const isAdmin =
    Boolean(user?.email) &&
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    getPublishedStories()
      .then((data) => {
        if (mounted) setStories(data);
      })
      .catch(() => {
        if (mounted) setStories([]);
      })
      .finally(() => {
        if (mounted) setStoriesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    goHomeWithReload();
  };

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-[#151313] px-5 py-6 text-[#f6eee7] sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_12%,rgba(185,122,118,0.2),transparent_34%),linear-gradient(135deg,#151313,#211919_58%,#2f2020)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <HomeLink className="text-lg font-semibold sm:text-xl">
          오늘의 장면
        </HomeLink>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-full border border-[#d2ad78]/25 bg-[#d2ad78]/10 px-4 py-2 text-sm text-[#f4e1c0] backdrop-blur-md transition hover:bg-[#d2ad78]/15"
            >
              관리자
            </Link>
          ) : null}
          <Link
            href="/mypage"
            className="rounded-full border border-[#f3d8bf]/20 bg-white/5 px-4 py-2 text-sm text-[#f6eee7] backdrop-blur-md transition hover:bg-white/10"
          >
            내 장면
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

      <section className="mx-auto max-w-6xl py-16 md:py-24">
        <p className="mb-4 text-sm font-medium text-[#d2ad78]">
          오늘의 이야기
        </p>
        <h1 className="max-w-3xl break-keep text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
          오늘은 어떤 장면으로 들어갈까요?
        </h1>
  
        {storiesLoading ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="min-h-[260px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.055]"
              />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="mt-12 rounded-[30px] border border-white/10 bg-white/[0.055] p-8 text-center backdrop-blur-xl">
            <h2 className="break-keep text-2xl font-semibold text-[#fff8f1]">
              아직 열려 있는 장면이 없어요.
            </h2>
            <p className="mx-auto mt-4 max-w-md break-keep text-sm leading-7 text-[#e6d6ca]/75">
              {isAdmin
                ? "관리자 화면에서 이야기를 등록해주세요."
                : "새로운 장면이 열릴 예정이에요."}
            </p>
            {isAdmin ? (
              <Link
                href="/admin"
                className="mt-7 inline-flex rounded-full bg-[#c98a82] px-6 py-3 text-sm font-semibold text-[#1d1414]"
              >
                관리자 화면으로 가기
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <article
                key={story.id}
                className="group flex min-h-[280px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c98a82]/45 hover:bg-white/[0.085]"
              >
                <div>
                  <div className="mb-7 flex items-center justify-between gap-4">
                    {story.cover_image_url ? (
                      <div
                        className="h-14 w-14 rounded-2xl bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${story.cover_image_url})`,
                        }}
                      />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d2ad78]/12 text-3xl">
                        {story.cover_emoji || "•"}
                      </span>
                    )}
                    <span className="rounded-full bg-[#d2ad78]/12 px-3 py-1 text-xs text-[#d2ad78]">
                      {story.category || "이야기"}
                    </span>
                  </div>
                  <h2 className="break-keep text-2xl font-semibold tracking-[-0.02em] text-[#fff8f1]">
                    {story.title}
                  </h2>
                  {story.subtitle ? (
                    <p className="mt-3 break-keep text-sm leading-6 text-[#f0dfd1]/82">
                      {story.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/76">
                    {story.description}
                  </p>
                </div>
                <Link
                  href={`/stories/${story.id}`}
                  className="mt-8 rounded-full bg-[#c98a82] px-5 py-3 text-center text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92]"
                >
                  장면 들어가기
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
