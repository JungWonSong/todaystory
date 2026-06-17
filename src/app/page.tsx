"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthNav } from "@/components/AuthNav";
import { StartButton } from "@/components/StartButton";
import { useAuth } from "@/hooks/useAuth";
import { getLandingStories } from "@/lib/stories";
import type { Story } from "@/types/story";

type LandingStory = Partial<Story> & {
  main_conflict?: string | null;
  protagonist_role?: string | null;
};

const fallbackStories: LandingStory[] = [
  {
    title: "남편이 모르는 내 마음",
    subtitle: "식탁 앞에 선 당신.",
    description:
      "무심한 한마디 앞에서, 오늘은 참을까 말할까. 오래 삼킨 말이 장면의 공기를 바꿉니다.",
    category: "가족",
    cover_emoji: "✦",
    protagonist_role: "오늘 처음으로 내 마음을 말하려는 사람",
  },
  {
    title: "그때의 나에게 답장하기",
    subtitle: "스물다섯의 나에게서 문자가 왔다.",
    description:
      "지금의 나는 뭐라고 답할 수 있을까. 지난 선택과 오늘의 마음이 한 장면에서 만납니다.",
    category: "회상",
    cover_emoji: "✉",
    protagonist_role: "오래전의 나에게 답장을 써야 하는 사람",
  },
  {
    title: "인간모드",
    subtitle: "모든 추천이 꺼진 오후.",
    description:
      "처음으로 내 말로 대답해야 한다. 정해진 선택지 없이 상대의 눈을 마주봅니다.",
    category: "드라마",
    cover_emoji: "◐",
    protagonist_role: "감정을 다시 배우기 시작한 사람",
  },
  {
    title: "다시, 내 이름으로",
    subtitle: "오래 불리지 않던 이름 앞으로 편지가 도착했다.",
    description:
      "나는 그 이름을 다시 받아들일 수 있을까. 잊고 지낸 나를 부르는 장면입니다.",
    category: "감정",
    cover_emoji: "⌁",
    protagonist_role: "자신의 이름을 다시 마주하는 사람",
  },
];

const experienceCards = [
  {
    title: "이야기를 고릅니다",
    desc: "오늘 마음이 머무는 장면을 하나 선택해요.",
  },
  {
    title: "주인공이 됩니다",
    desc: "여성 주인공 또는 남성 주인공으로 장면에 들어가요.",
  },
  {
    title: "대사를 씁니다",
    desc: "장면이 멈춘 곳에서, 주인공의 말을 직접 적어요.",
  },
];

const howSteps = [
  {
    step: "01",
    title: "장면을 고른다",
    desc: "다시, 내 이름으로 / 인간모드 / 남편이 모르는 내 마음처럼 오늘 들어가고 싶은 이야기를 고릅니다.",
  },
  {
    step: "02",
    title: "내가 될 주인공을 선택한다",
    desc: "여성 주인공 또는 남성 주인공으로 들어갈 수 있어요. 선택에 따라 상대 인물과 첫 장면이 달라집니다.",
  },
  {
    step: "03",
    title: "멈춘 장면에 대사를 넣는다",
    desc: "상대가 말을 건네는 순간, 이야기가 잠시 멈춰요. 그때 주인공의 대사를 직접 적습니다.",
  },
  {
    step: "04",
    title: "다음 장면이 이어진다",
    desc: "내가 쓴 말이 본문 속 대사가 되고, 그 말에 따라 분위기와 관계가 조금씩 달라집니다.",
  },
];

const values = [
  "누군가에게 하지 못한 말을 안전한 장면 안에서 꺼내볼 수 있어요.",
  "같은 이야기라도 내가 쓴 한마디에 따라 분위기가 달라져요.",
  "읽고 끝나는 이야기가 아니라, 내 마음이 지나간 장면으로 남아요.",
  "하루 끝, 잠깐이라도 내가 주인공인 시간을 가질 수 있어요.",
];

function getStorySignal(story: LandingStory) {
  return (
    story.main_conflict ||
    story.protagonist_role ||
    story.female_protagonist_role ||
    story.male_protagonist_role ||
    story.description ||
    ""
  );
}

export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log("supabase env check:", {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });

    getLandingStories()
      .then((data) => {
        if (mounted) setStories(data);
      })
      .catch((error) => {
        console.error("landing stories load failed:", error);
        if (mounted) setStories([]);
      })
      .finally(() => {
        if (mounted) setStoriesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleStoryStart = (story?: LandingStory) => {
    if (!user) {
      router.push("/login");
      return;
    }

    router.push(story?.id ? `/stories/${story.id}` : "/stories");
  };

  const visibleStories: LandingStory[] =
    stories.length > 0 ? stories : fallbackStories;

  return (
    <main className="min-h-screen bg-[#151313] text-[#f6eee7] selection:bg-[#b97a76]/40 selection:text-white">
      <section className="relative min-h-screen overflow-hidden px-5 pb-14 pt-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(185,122,118,0.22),transparent_34%),radial-gradient(circle_at_18%_78%,rgba(191,154,92,0.16),transparent_30%),linear-gradient(135deg,#151313_0%,#241d1d_50%,#332323_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(255,248,241,0.08)_1px,transparent_1px),linear-gradient(rgba(255,248,241,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute bottom-[-160px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#b97a76]/20 blur-3xl" />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 py-4 sm:py-6">
          <div className="shrink-0 text-lg font-semibold tracking-[-0.01em] text-[#fff8f1] sm:text-xl">
            오늘의 장면
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[#e3d4ca]/75 md:flex">
            <a href="#experience" className="transition hover:text-white">
              경험
            </a>
            <a href="#demo" className="transition hover:text-white">
              미리보기
            </a>
            <a href="#collection" className="transition hover:text-white">
              이야기
            </a>
          </nav>
          <AuthNav />
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col justify-center gap-12 py-10 sm:py-16 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <div className="max-w-[760px]">
            <p className="mb-5 break-keep text-sm font-medium tracking-[-0.01em] text-[#d2ad78]">
              읽는 이야기가 아니라, 내가 주인공이 되기
            </p>
            <h1 className="mt-6 max-w-[760px] break-keep text-[38px] font-extrabold leading-[1.12] tracking-[-0.045em] text-[#fff7ea] min-[380px]:text-[40px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px]">
              <span className="block">이야기 속 한 장면, 내가</span>
              <span className="block">주인공이 됩니다.</span>
            </h1>
            <p className="mt-7 max-w-[620px] break-keep text-[17px] leading-[1.85] tracking-[-0.02em] text-[#f4e7d4]/90 sm:text-xl sm:leading-[1.9]">
              이야기 속 주인공을 선택하고,
              <br />
              멈춰 선 장면에 당신의 대사를 넣어보세요.
              <br />
              그 한마디로 다음 장면이 조용히 이어집니다.
            </p>
            <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
              <StartButton className="w-full rounded-full bg-[#c98a82] px-7 py-4 text-center text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.28)] transition hover:bg-[#d99b92] sm:w-auto">
                첫 장면 들어가기
              </StartButton>
              <a
                href="#demo"
                className="w-full rounded-full border border-[#f3d8bf]/20 bg-white/6 px-7 py-4 text-center text-sm font-semibold text-[#f7eee7] backdrop-blur-md transition hover:bg-white/10 sm:w-auto"
              >
                어떻게 이어지는지 보기
              </a>
            </div>
          </div>

          <div className="relative mx-auto h-[610px] w-full max-w-[360px] sm:h-[560px] sm:max-w-[390px] lg:mr-0">
            <div className="absolute left-8 top-8 h-[460px] w-[280px] rounded-[44px] bg-[#efe1d2]/10 blur-2xl" />
            <div className="relative h-full overflow-hidden rounded-[46px] border border-white/14 bg-[#211b1b]/70 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
              <div className="h-full overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(255,248,241,0.13),rgba(255,248,241,0.045))] p-5">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs text-[#e8d9ce]/60">
                    다시, 내 이름으로
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#d2ad78]" />
                </div>
                <div className="space-y-5">
                  <p className="break-keep text-[13px] leading-7 text-[#f8eee6]/86 sm:text-sm">
                    비가 오던 오후, 우편함 안에는 낯선 봉투 하나가 들어
                    있었다.
                  </p>
                  <p className="break-keep text-[13px] leading-7 text-[#f8eee6]/86 sm:text-sm">
                    봉투 겉면에는 가족들이 부르는 호칭이 아니라, 오래전 내가
                    좋아했던 내 이름이 적혀 있었다.
                  </p>
                  <div className="rounded-2xl border border-[#f1d4bd]/16 bg-[#151313]/42 p-4">
                    <p className="mb-3 text-xs text-[#d2ad78]">
                      장면이 멈춘 곳
                    </p>
                    <p className="break-keep text-[13px] leading-6 text-white sm:text-sm">
                      나는 봉투를 들고 뭐라고 중얼거릴까?
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#c98a82]/28 bg-[#2a2020]/65 p-4">
                    <p className="mb-3 text-xs text-[#f0b8b2]">
                      내가 쓴 대사
                    </p>
                    <p className="break-keep text-[13px] leading-6 text-[#fff8f1] sm:text-sm">
                      “아직도 누가 내 이름을 기억하고 있었네.”
                    </p>
                  </div>
                  <p className="break-keep text-[13px] leading-7 text-[#f8eee6]/82 sm:text-sm">
                    입 밖으로 나온 말은 생각보다 작았다. 하지만 그 말이
                    현관의 고요를 아주 천천히 흔들었다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium text-[#d2ad78]">
              핵심 경험
            </p>
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              당신은 독자가 아니라,
              <br />
              이 장면의 주인공입니다.
            </h2>
            <p className="mt-6 max-w-2xl break-keep text-base leading-8 text-[#e6d6ca]/78">
              이야기를 고르고, 주인공의 역할을 선택합니다. 상대 인물이 말을
              건네는 순간, 장면은 잠시 멈춥니다. 그다음 말은 당신이 씁니다.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {experienceCards.map((item, index) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-7 backdrop-blur-xl"
              >
                <span className="text-sm font-semibold text-[#d2ad78]">
                  0{index + 1}
                </span>
                <h3 className="mt-6 break-keep text-xl font-semibold text-[#fff8f1]">
                  {item.title}
                </h3>
                <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/76">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1d1818] px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-sm font-medium text-[#d2ad78]">
              장면이 이어지는 방식
            </p>
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              멈춘 순간에 쓴 한마디가
              <br />
              다음 장면의 온도를 바꿉니다.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-[#f4d6bd]/12 bg-[#fff8f1]/6 p-7"
              >
                <span className="text-sm font-semibold text-[#d2ad78]">
                  {item.step}
                </span>
                <h3 className="mt-6 break-keep text-xl font-semibold text-[#fff8f1]">
                  {item.title}
                </h3>
                <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/76">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <p className="mb-4 text-sm font-medium text-[#d2ad78]">
              한 장면이 멈춘 순간
            </p>
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              내 대사가 들어가면,
              <br />
              장면은 조금 다르게 남습니다.
            </h2>
            <p className="mt-6 max-w-md break-keep text-base leading-8 text-[#e6d6ca]/78">
              휴대폰 안의 화면은 조용한 소설 페이지에 가깝습니다. 중요한
              순간에 멈춘 장면 위로, 당신의 한마디가 들어갑니다.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[430px] rounded-[42px] border border-white/12 bg-[#0f0e0e] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="rounded-[32px] bg-[#211b1a] p-5">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#fff8f1]">
                    다시, 내 이름으로
                  </p>
                  <p className="mt-1 text-xs text-[#e6d6ca]/48">
                    장면이 멈춘 곳
                  </p>
                </div>
                <span className="rounded-full bg-[#d2ad78]/14 px-3 py-1 text-xs text-[#d2ad78]">
                  소설 페이지
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl bg-[#fff8f1]/7 p-5">
                  <p className="break-keep text-sm leading-8 text-[#f4e7dc]/88">
                    비가 오던 오후,
                    <br />
                    우편함 안에는 낯선 봉투 하나가 들어 있었다.
                  </p>
                  <p className="mt-4 break-keep text-sm leading-8 text-[#f4e7dc]/88">
                    봉투 겉면에는 가족들이 부르는 호칭이 아니라, 오래전 내가
                    좋아했던 내 이름이 적혀 있었다.
                  </p>
                  <p className="mt-4 break-keep text-sm leading-8 text-[#f4e7dc]/88">
                    그때, 봉투 안쪽에서 작은 메모지가 떨어졌다.
                  </p>
                  <p className="mt-4 break-keep border-l border-[#d2ad78]/45 pl-4 text-sm leading-7 text-[#fff8f1]">
                    “아직도 이 이름을 쓰시나요?”
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f1d4bd]/16 bg-[#151313]/60 p-5">
                  <p className="mb-3 text-xs font-medium text-[#d2ad78]">
                    장면이 멈춘 곳
                  </p>
                  <p className="break-keep text-sm leading-7 text-[#fff8f1]">
                    나는 봉투를 들고 뭐라고 중얼거릴까?
                  </p>
                </div>

                <div className="rounded-2xl border border-[#c98a82]/28 bg-[#2a2020]/70 p-5">
                  <p className="mb-3 text-xs font-medium text-[#f0b8b2]">
                    주인공의 대사
                  </p>
                  <p className="break-keep text-sm leading-7 text-[#fff8f1]">
                    “아직도 누가 내 이름을 기억하고 있었네.”
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#f7eadc]/9 p-5">
                  <p className="break-keep text-sm leading-8 text-[#f4e7dc]/86">
                    입 밖으로 나온 말은 생각보다 작았다. 하지만 그 말이
                    현관의 고요를 아주 천천히 흔들었다. 나는 봉투 끝을
                    손끝으로 문질렀다. 젖은 종이 냄새와 함께 오래 덮어두었던
                    시간이 올라오는 것 같았다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1d1818] px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-sm font-medium text-[#d2ad78]">
              처음에는 두 가지 주인공으로 시작합니다
            </p>
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              같은 이야기,
              <br />
              다른 주인공.
            </h2>
            <p className="mt-6 break-keep text-base leading-8 text-[#e6d6ca]/78">
              같은 세계 안에서도 어떤 주인공으로 들어가느냐에 따라 마주하는
              사람과 첫 장면이 달라집니다.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                title: "여성 주인공으로 들어가기",
                role: "당신은 감정을 잃어버린 채 인간학교에 들어온 사람입니다.",
                person: "상대 인물: 이도윤",
                line: "“방금, 안내 모드 사용했습니까?”",
              },
              {
                title: "남성 주인공으로 들어가기",
                role: "당신은 감정을 통제하는 법만 배워온 사람입니다.",
                person: "상대 인물: 한서윤",
                line: "“그쪽도 지금 아무것도 안 떠요?”",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-white/10 bg-white/[0.055] p-7 backdrop-blur-xl"
              >
                <h3 className="break-keep text-2xl font-semibold text-[#fff8f1]">
                  {item.title}
                </h3>
                <p className="mt-5 break-keep text-sm leading-7 text-[#e6d6ca]/78">
                  {item.role}
                </p>
                <p className="mt-6 text-sm font-medium text-[#d2ad78]">
                  {item.person}
                </p>
                <p className="mt-3 break-keep border-l border-[#c98a82]/45 pl-4 text-base leading-7 text-[#fff8f1]">
                  {item.line}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="collection" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <p className="mb-4 text-sm font-medium text-[#d2ad78]">
              오늘 들어갈 수 있는 장면들
            </p>
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              마음이 먼저 고르는 이야기
            </h2>
          </div>

          {storiesLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="min-h-[280px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.055] p-7"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleStories.map((story) => {
                const signal = getStorySignal(story);

                return (
                  <article
                    key={story.id || story.title}
                    className="group flex min-h-[300px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c98a82]/45 hover:bg-white/[0.085]"
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
                            {story.cover_emoji || "✦"}
                          </span>
                        )}
                        <span className="rounded-full bg-[#d2ad78]/12 px-3 py-1 text-xs text-[#d2ad78]">
                          {story.category || "이야기"}
                        </span>
                      </div>
                      <h3 className="break-keep text-2xl font-semibold tracking-[-0.02em] text-[#fff8f1]">
                        {story.title}
                      </h3>
                      {story.subtitle ? (
                        <p className="mt-3 break-keep text-sm leading-6 text-[#f0dfd1]/82">
                          {story.subtitle}
                        </p>
                      ) : null}
                      <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/76">
                        {story.description}
                      </p>
                      {signal ? (
                        <p className="mt-5 break-keep rounded-2xl border border-[#f4d6bd]/12 bg-[#151313]/40 px-4 py-4 text-sm leading-7 text-[#fff8f1]/86">
                          {signal}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStoryStart(story)}
                      className="mt-8 rounded-full border border-[#c98a82]/30 px-5 py-3 text-sm font-semibold text-[#f3c4bf] transition hover:bg-[#c98a82]/10"
                    >
                      장면 들어가기
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#1d1818] px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="break-keep text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-[#fff8f1] md:text-5xl">
              내 말이 들어간 장면은
              <br />
              조금 다르게 남습니다.
            </h2>
            <div className="grid gap-4">
              {values.map((value) => (
                <div
                  key={value}
                  className="rounded-2xl border border-[#f4d6bd]/12 bg-[#fff8f1]/6 p-6"
                >
                  <p className="break-keep text-lg leading-8 text-[#efe2d8]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(201,138,130,0.22),rgba(210,173,120,0.12),rgba(255,255,255,0.05))] px-6 py-16 text-center backdrop-blur-xl md:px-12 md:py-20">
          <p className="mb-5 text-sm font-medium text-[#d2ad78]">
            오늘의 장면
          </p>
          <h2 className="mx-auto max-w-2xl break-keep text-4xl font-semibold leading-[1.18] tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
            오늘, 어떤 장면에 들어가볼까요?
          </h2>
          <p className="mx-auto mt-6 max-w-xl break-keep text-base leading-8 text-[#e6d6ca]/78">
            읽기만 하던 이야기에서 잠시 내려와, 주인공의 첫마디를 직접
            써보세요.
          </p>
          <StartButton className="mt-10 inline-flex rounded-full bg-[#c98a82] px-8 py-4 text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.26)] transition hover:bg-[#d99b92]">
            첫 장면 들어가기
          </StartButton>
        </div>
      </section>
    </main>
  );
}
