"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminMetrics } from "@/lib/analytics";
import { formatDuration, formatNumber, formatPercent } from "@/lib/format";
import type { AdminMetrics } from "@/types/analytics";

const periods = [7, 14, 30] as const;

function MetricCard({
  label,
  value,
  subText,
}: {
  label: string;
  value: string;
  subText?: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <p className="break-keep text-sm text-[#e6d6ca]/64">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#fff8f1]">
        {value}
      </p>
      {subText ? (
        <p className="mt-2 break-keep text-xs leading-5 text-[#e6d6ca]/48">
          {subText}
        </p>
      ) : null}
    </article>
  );
}

function emptyMetrics(): AdminMetrics {
  return {
    total_visitors: 0,
    total_page_views: 0,
    avg_duration_seconds: 0,
    returning_visitor_rate: 0,
    signup_count: 0,
    login_user_count: 0,
    story_start_count: 0,
    line_submit_count: 0,
    top_stories: [],
    daily: [],
  };
}

export function AdminMetricsPanel({ enabled }: { enabled: boolean }) {
  const [days, setDays] = useState<(typeof periods)[number]>(7);
  const [metrics, setMetrics] = useState<AdminMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    setLoading(true);
    setError("");

    getAdminMetrics(days)
      .then((data) => {
        if (mounted) setMetrics(data);
      })
      .catch((error) => {
        if (!mounted) return;
        setError(
          error instanceof Error
            ? error.message
            : "운영 지표를 불러오지 못했어요.",
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [days, enabled]);

  const maxStoryCount = useMemo(
    () =>
      Math.max(1, ...metrics.top_stories.map((story) => Number(story.count))),
    [metrics.top_stories],
  );

  if (!enabled) return null;

  return (
    <section className="mt-12 rounded-[30px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-sm font-medium text-[#d2ad78]">
            운영 지표
          </p>
          <h2 className="break-keep text-3xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-4xl">
            오늘의 장면이 어떻게 읽히고 있는지 봅니다.
          </h2>
          <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/68">
            방문, 체류, 가입, 장면 시작과 대사 입력 흐름을 간단히 확인해요.
          </p>
        </div>

        <div className="flex rounded-full border border-white/10 bg-[#151313]/55 p-1">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                days === period
                  ? "bg-[#c98a82] font-semibold text-[#1d1414]"
                  : "text-[#e6d6ca]/68 hover:bg-white/10"
              }`}
            >
              {period}일
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-5 py-4 text-sm text-[#f3c4bf]">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="방문자수"
          value={`${formatNumber(metrics.total_visitors)}명`}
          subText={`${days}일 동안의 순 방문자`}
        />
        <MetricCard
          label="페이지뷰"
          value={`${formatNumber(metrics.total_page_views)}회`}
        />
        <MetricCard
          label="평균 체류시간"
          value={formatDuration(metrics.avg_duration_seconds)}
        />
        <MetricCard
          label="재방문률"
          value={formatPercent(metrics.returning_visitor_rate)}
        />
        <MetricCard
          label="회원가입수"
          value={`${formatNumber(metrics.signup_count)}명`}
        />
        <MetricCard
          label="로그인 사용자수"
          value={`${formatNumber(metrics.login_user_count)}명`}
        />
        <MetricCard
          label="스토리 시작"
          value={`${formatNumber(metrics.story_start_count)}회`}
        />
        <MetricCard
          label="대사 입력"
          value={`${formatNumber(metrics.line_submit_count)}회`}
        />
      </div>

      {loading ? (
        <p className="mt-8 rounded-2xl bg-white/[0.055] p-5 text-sm text-[#e6d6ca]/70">
          지표를 불러오는 중...
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-white/10 bg-[#151313]/42 p-5">
          <h3 className="text-lg font-semibold text-[#fff8f1]">
            최근 {days}일 추이
          </h3>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-[#d2ad78]">
                <tr className="border-b border-white/10">
                  <th className="py-3 font-medium">날짜</th>
                  <th className="py-3 font-medium">방문자</th>
                  <th className="py-3 font-medium">페이지뷰</th>
                  <th className="py-3 font-medium">회원가입</th>
                  <th className="py-3 font-medium">스토리 시작</th>
                </tr>
              </thead>
              <tbody className="text-[#e6d6ca]/78">
                {metrics.daily.map((day) => (
                  <tr key={day.date} className="border-b border-white/6">
                    <td className="py-3">{day.date}</td>
                    <td className="py-3">{formatNumber(day.visitors)}</td>
                    <td className="py-3">{formatNumber(day.page_views)}</td>
                    <td className="py-3">{formatNumber(day.signups)}</td>
                    <td className="py-3">{formatNumber(day.story_starts)}</td>
                  </tr>
                ))}
                {metrics.daily.length === 0 ? (
                  <tr>
                    <td className="py-5 text-[#e6d6ca]/52" colSpan={5}>
                      아직 표시할 추이가 없어요.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#151313]/42 p-5">
          <h3 className="text-lg font-semibold text-[#fff8f1]">
            인기 스토리
          </h3>
          <div className="mt-5 space-y-4">
            {metrics.top_stories.map((story) => {
              const width = Math.max(8, (story.count / maxStoryCount) * 100);

              return (
                <div key={story.story_id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 break-keep text-sm text-[#e6d6ca]/82">
                      {story.title}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-[#d2ad78]">
                      {formatNumber(story.count)}회
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#c98a82,#d2ad78)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {metrics.top_stories.length === 0 ? (
              <p className="rounded-2xl bg-white/[0.055] p-5 text-sm text-[#e6d6ca]/60">
                아직 시작된 스토리가 없어요.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
