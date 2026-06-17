"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminMetricsPanel } from "@/components/AdminMetricsPanel";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import {
  createStory,
  deleteStory,
  getAllStoriesForAdmin,
  updateStory,
} from "@/lib/stories";
import type { Story, StoryFormInput, StoryStatus } from "@/types/story";

const defaultForm: StoryFormInput = {
  title: "인간모드",
  subtitle: "모든 안내가 꺼진 오후, 처음으로 내 마음을 선택하는 이야기",
  description:
    "감정과 선택을 대신 맡기던 시대에, 주인공은 낯선 훈련소에서 자기 마음으로 말하는 법을 배운다.",
  category: "감정 / 관계",
  cover_emoji: "🌙",
  cover_image_url: "",
  mood: "조용한 오후, 복도, 멈춘 화면, 오래 눌러둔 감정",
  target_audience: "내 마음을 자주 뒤로 미뤄둔 사람",
  opening_scene: "",
  first_question: "",
  story_world:
    "가까운 미래, 사람들은 감정 표현과 선택을 편리한 시스템에 맡긴 채 살아간다.",
  main_plot:
    "인간모드 훈련소에 들어온 주인공이 자기 감정으로 선택하는 법을 배우며, 낯선 상대와 함께 훈련소의 비밀에 가까워진다.",
  plot_twist:
    "인간모드 훈련소는 사람을 회복시키는 기관이 아니라, 인간성을 끝까지 지키려는 사람을 선별하는 시험장이다.",
  female_protagonist_role: "감정을 잊어버린 채 인간모드에 들어온 여자",
  male_protagonist_role: "감정을 통제하는 법만 배워온 남자",
  male_lead_name: "도윤",
  male_lead_profile:
    "차갑고 논리적인 말투를 가졌지만, 주인공의 작은 흔들림을 누구보다 먼저 알아차린다.",
  female_lead_name: "서아",
  female_lead_profile:
    "방어적이고 무심해 보이지만, 사실은 자기 감정을 확인받고 싶어 한다.",
  female_route_opening_scene:
    "목요일 오후 2시.\n인간모드 첫 번째 훈련이 시작됐다.\n오늘 자정까지 모든 안내 화면은 꺼진다고 했다.\n그때 복도 끝에서 도윤이 나를 바라보고 있었다.",
  male_route_opening_scene:
    "목요일 오후 2시.\n인간모드 첫 훈련이 시작됐다.\n모든 안내 화면이 꺼진 복도에서, 서아는 불안한 듯 손끝을 쥐고 있었다.\n나는 그 앞을 지나치려다 걸음을 멈췄다.",
  female_route_npc_line: "지금도 안내 화면을 기다리고 있습니까?",
  male_route_npc_line: "그쪽도 지금 아무것도 모르겠어요?",
  female_route_pause_question: "나는 그를 바라보며 뭐라고 대답할까?",
  male_route_pause_question: "나는 서아에게 뭐라고 말할까?",
  route_common_rules:
    "초반부터 관계를 확정하지 말 것.\n상대를 악역으로만 만들지 말 것.\n감정은 행동과 침묵으로 천천히 쌓을 것.\n훈련소의 비밀은 조금씩 드러낼 것.",
  status: "draft",
  is_active: false,
  show_on_landing: false,
  display_order: 0,
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-[#151313]/70 px-4 py-3 text-sm text-[#fff8f1] outline-none transition placeholder:text-[#e6d6ca]/35 focus:border-[#c98a82]/70";
const labelClass = "mb-2 block text-sm text-[#efe2d8]";

type TextFieldName = Exclude<
  keyof StoryFormInput,
  "status" | "is_active" | "show_on_landing" | "display_order"
>;

function toFormInput(story: Story): StoryFormInput {
  return {
    title: story.title,
    subtitle: story.subtitle ?? "",
    description: story.description,
    category: story.category ?? "",
    cover_emoji: story.cover_emoji ?? "",
    cover_image_url: story.cover_image_url ?? "",
    mood: story.mood ?? "",
    target_audience: story.target_audience ?? "",
    opening_scene: story.opening_scene ?? "",
    first_question: story.first_question ?? "",
    story_world: story.story_world ?? "",
    main_plot: story.main_plot ?? "",
    plot_twist: story.plot_twist ?? "",
    female_protagonist_role: story.female_protagonist_role ?? "",
    male_protagonist_role: story.male_protagonist_role ?? "",
    male_lead_name: story.male_lead_name ?? "",
    male_lead_profile: story.male_lead_profile ?? "",
    female_lead_name: story.female_lead_name ?? "",
    female_lead_profile: story.female_lead_profile ?? "",
    female_route_opening_scene: story.female_route_opening_scene ?? "",
    male_route_opening_scene: story.male_route_opening_scene ?? "",
    female_route_npc_line: story.female_route_npc_line ?? "",
    male_route_npc_line: story.male_route_npc_line ?? "",
    female_route_pause_question: story.female_route_pause_question ?? "",
    male_route_pause_question: story.male_route_pause_question ?? "",
    route_common_rules: story.route_common_rules ?? "",
    status: story.status,
    is_active: story.is_active,
    show_on_landing: story.show_on_landing,
    display_order: story.display_order,
  };
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      {textarea ? (
        <textarea
          className={`${inputClass} min-h-28 resize-none leading-7`}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [form, setForm] = useState<StoryFormInput>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin =
    Boolean(user?.email) &&
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const loadStories = useCallback(async () => {
    setPageLoading(true);
    setError("");
    try {
      setStories(await getAllStoriesForAdmin());
    } catch (error) {
      setError(error instanceof Error ? error.message : "목록을 불러오지 못했어요.");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user && isAdmin) void loadStories();
  }, [isAdmin, loadStories, loading, user]);

  const updateTextField = (name: TextFieldName, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      setError("로그인 후 다시 시도해주세요.");
      return;
    }

    if (!hasSupabaseEnv) {
      setError("Supabase 환경변수를 먼저 설정해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateStory(editingId, form);
        setMessage("이야기를 수정했어요.");
      } else {
        await createStory(form, user.id);
        setMessage("이야기를 등록했어요.");
      }
      resetForm();
      await loadStories();
    } catch (error) {
      setError(error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (story: Story) => {
    setEditingId(story.id);
    setForm(toFormInput(story));
    setMessage("수정 모드로 전환했어요.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (story: Story) => {
    if (!window.confirm("정말 이 이야기를 삭제할까요?")) return;
    setError("");
    setMessage("");
    try {
      await deleteStory(story.id);
      setMessage("이야기를 삭제했어요.");
      await loadStories();
    } catch (error) {
      setError(error instanceof Error ? error.message : "삭제하지 못했어요.");
    }
  };

  if (loading || (!loading && !user)) return <LoadingScreen />;

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151313] px-5 text-[#f6eee7]">
        <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.065] p-7 text-center backdrop-blur-2xl">
          <p className="text-sm font-medium text-[#d2ad78]">오늘의 장면</p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
            접근할 수 없는 화면이에요.
          </h1>
          <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/75">
            관리자 이메일로 로그인한 계정만 이야기 관리를 사용할 수 있어요.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[#c98a82] px-6 py-3 text-sm font-semibold text-[#1d1414]"
          >
            홈으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#151313] px-5 py-6 text-[#f6eee7] sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_14%,rgba(185,122,118,0.2),transparent_34%),linear-gradient(135deg,#151313,#211919_58%,#2f2020)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="text-lg font-semibold sm:text-xl">
          오늘의 장면
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/stories" className="rounded-full border border-[#f3d8bf]/20 bg-white/5 px-4 py-2 text-sm text-[#f6eee7] backdrop-blur-md transition hover:bg-white/10">
            이야기
          </Link>
          <Link href="/mypage" className="rounded-full bg-[#c98a82] px-4 py-2 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92]">
            내 장면
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl py-14 md:py-20">
        <p className="mb-4 text-sm font-medium text-[#d2ad78]">관리자 화면</p>
        <h1 className="break-keep text-4xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
          이야기의 세계와 역할을 설계해요.
        </h1>
        <p className="mt-5 max-w-2xl break-keep text-base leading-8 text-[#e6d6ca]/76">
          같은 이야기라도 어떤 주인공으로 들어가느냐에 따라 첫 장면과 상대의
          말, 멈추는 질문이 달라집니다.
        </p>

        {message ? <p className="mt-8 rounded-2xl border border-[#d2ad78]/20 bg-[#d2ad78]/10 px-5 py-4 text-sm text-[#f4e1c0]">{message}</p> : null}
        {error ? <p className="mt-8 rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-5 py-4 text-sm text-[#f3c4bf]">{error}</p> : null}

        <AdminMetricsPanel enabled={isAdmin} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="rounded-[30px] border border-white/10 bg-white/[0.065] p-6 backdrop-blur-2xl md:p-8">
            <div className="mb-7 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#fff8f1]">
                {editingId ? "이야기 수정하기" : "새 이야기 등록"}
              </h2>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#e6d6ca]/80 transition hover:bg-white/10">
                  취소
                </button>
              ) : null}
            </div>

            <div className="grid gap-7">
              <div className="grid gap-5">
                <h3 className="text-lg font-semibold text-[#fff8f1]">기본 정보</h3>
                <Field label="제목" value={form.title} onChange={(value) => updateTextField("title", value)} />
                <Field label="한 줄 소개" value={form.subtitle} onChange={(value) => updateTextField("subtitle", value)} />
                <Field label="설명" value={form.description} textarea onChange={(value) => updateTextField("description", value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="카테고리" value={form.category} onChange={(value) => updateTextField("category", value)} />
                  <Field label="이모지" value={form.cover_emoji} onChange={(value) => updateTextField("cover_emoji", value)} />
                </div>
                <Field label="이미지 URL" value={form.cover_image_url} onChange={(value) => updateTextField("cover_image_url", value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="분위기" value={form.mood} onChange={(value) => updateTextField("mood", value)} />
                  <Field label="대상 독자" value={form.target_audience} onChange={(value) => updateTextField("target_audience", value)} />
                </div>
                <Field label="기본 첫 장면" value={form.opening_scene} textarea onChange={(value) => updateTextField("opening_scene", value)} />
                <Field label="기본 멈춤 질문" value={form.first_question} onChange={(value) => updateTextField("first_question", value)} />
              </div>

              <div className="grid gap-5 rounded-3xl border border-white/10 bg-[#151313]/35 p-5">
                <h3 className="text-lg font-semibold text-[#fff8f1]">줄거리</h3>
                <Field label="세계관" value={form.story_world} textarea placeholder="가까운 미래, 사람들은 감정 표현과 선택을 시스템에 맡긴 채 살아간다." onChange={(value) => updateTextField("story_world", value)} />
                <Field label="큰 줄거리" value={form.main_plot} textarea onChange={(value) => updateTextField("main_plot", value)} />
                <Field label="복선 / 반전" value={form.plot_twist} textarea onChange={(value) => updateTextField("plot_twist", value)} />
                <Field label="공통 전개 규칙" value={form.route_common_rules} textarea onChange={(value) => updateTextField("route_common_rules", value)} />
              </div>

              <div className="grid gap-5 rounded-3xl border border-white/10 bg-[#151313]/35 p-5">
                <h3 className="text-lg font-semibold text-[#fff8f1]">여성 주인공 루트</h3>
                <Field label="여성 주인공 역할" value={form.female_protagonist_role} onChange={(value) => updateTextField("female_protagonist_role", value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="상대 인물 이름" value={form.male_lead_name} onChange={(value) => updateTextField("male_lead_name", value)} />
                  <Field label="상대 인물 설정" value={form.male_lead_profile} textarea onChange={(value) => updateTextField("male_lead_profile", value)} />
                </div>
                <Field label="여성 루트 첫 장면" value={form.female_route_opening_scene} textarea onChange={(value) => updateTextField("female_route_opening_scene", value)} />
                <Field label="상대의 첫 대사" value={form.female_route_npc_line} onChange={(value) => updateTextField("female_route_npc_line", value)} />
                <Field label="장면이 멈추는 질문" value={form.female_route_pause_question} onChange={(value) => updateTextField("female_route_pause_question", value)} />
              </div>

              <div className="grid gap-5 rounded-3xl border border-white/10 bg-[#151313]/35 p-5">
                <h3 className="text-lg font-semibold text-[#fff8f1]">남성 주인공 루트</h3>
                <Field label="남성 주인공 역할" value={form.male_protagonist_role} onChange={(value) => updateTextField("male_protagonist_role", value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="상대 인물 이름" value={form.female_lead_name} onChange={(value) => updateTextField("female_lead_name", value)} />
                  <Field label="상대 인물 설정" value={form.female_lead_profile} textarea onChange={(value) => updateTextField("female_lead_profile", value)} />
                </div>
                <Field label="남성 루트 첫 장면" value={form.male_route_opening_scene} textarea onChange={(value) => updateTextField("male_route_opening_scene", value)} />
                <Field label="상대의 첫 대사" value={form.male_route_npc_line} onChange={(value) => updateTextField("male_route_npc_line", value)} />
                <Field label="장면이 멈추는 질문" value={form.male_route_pause_question} onChange={(value) => updateTextField("male_route_pause_question", value)} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>상태</span>
                  <select className={inputClass} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StoryStatus }))}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>노출 순서</span>
                  <input type="number" className={inputClass} value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/10 bg-[#151313]/70 p-4">
                  <span className="flex items-center gap-3 text-sm font-semibold text-[#efe2d8]">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                    스토리 페이지 공개
                  </span>
                  <span className="mt-2 block break-keep text-xs leading-5 text-[#e6d6ca]/62">켜두면 사용자가 /stories 화면에서 볼 수 있어요.</span>
                </label>
                <label className="rounded-2xl border border-white/10 bg-[#151313]/70 p-4">
                  <span className="flex items-center gap-3 text-sm font-semibold text-[#efe2d8]">
                    <input type="checkbox" checked={form.show_on_landing} onChange={(event) => setForm((current) => ({ ...current, show_on_landing: event.target.checked }))} />
                    랜딩페이지 노출
                  </span>
                  <span className="mt-2 block break-keep text-xs leading-5 text-[#e6d6ca]/62">켜두면 메인 랜딩의 이야기 카드에 보여요.</span>
                </label>
              </div>

              <button type="submit" disabled={submitting} className="rounded-full bg-[linear-gradient(135deg,#d59a92,#c98a82)] px-7 py-4 text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "저장 중..." : editingId ? "수정하기" : "등록하기"}
              </button>
            </div>
          </form>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl md:p-8">
            <h2 className="text-2xl font-semibold text-[#fff8f1]">등록된 이야기</h2>
            <div className="mt-6 space-y-4">
              {pageLoading ? (
                <p className="rounded-2xl bg-white/[0.055] p-5 text-sm text-[#e6d6ca]/70">불러오는 중...</p>
              ) : stories.length === 0 ? (
                <p className="rounded-2xl bg-white/[0.055] p-5 text-sm text-[#e6d6ca]/70">아직 등록된 이야기가 없어요.</p>
              ) : (
                stories.map((story) => (
                  <article key={story.id} className="rounded-2xl border border-white/10 bg-[#151313]/55 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d2ad78]/12 text-2xl">{story.cover_emoji || "•"}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-keep text-lg font-semibold text-[#fff8f1]">{story.title}</h3>
                        <p className="mt-1 break-keep text-sm leading-6 text-[#e6d6ca]/70">{story.subtitle || story.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white/8 px-3 py-1 text-[#e6d6ca]/75">status: {story.status}</span>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-[#e6d6ca]/75">active: {story.is_active ? "true" : "false"}</span>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-[#e6d6ca]/75">landing: {story.show_on_landing ? "true" : "false"}</span>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-[#e6d6ca]/75">order: {story.display_order}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button type="button" onClick={() => handleEdit(story)} className="rounded-full border border-[#d2ad78]/20 px-4 py-2 text-sm text-[#f4e1c0] transition hover:bg-[#d2ad78]/10">수정</button>
                      <button type="button" onClick={() => void handleDelete(story)} className="rounded-full border border-[#c98a82]/25 px-4 py-2 text-sm text-[#f3c4bf] transition hover:bg-[#c98a82]/10">삭제</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
