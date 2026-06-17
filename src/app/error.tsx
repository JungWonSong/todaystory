"use client";

import { useEffect } from "react";
import { goHomeWithReload } from "@/components/HomeLink";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app route render failed:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#151313] px-5 text-[#f6eee7]">
      <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.065] p-7 text-center backdrop-blur-2xl">
        <p className="text-sm font-medium text-[#d2ad78]">오늘의 장면</p>
        <h1 className="mt-5 break-keep text-3xl font-semibold tracking-[-0.03em] text-[#fff8f1]">
          장면을 다시 불러올게요.
        </h1>
        <p className="mt-4 break-keep text-sm leading-7 text-[#e6d6ca]/75">
          화면을 여는 중 잠시 멈췄어요. 다시 시도하거나 홈으로 돌아갈 수
          있어요.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-[#f3d8bf]/20 px-6 py-3 text-sm font-semibold text-[#f6eee7] transition hover:bg-white/10"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={goHomeWithReload}
            className="rounded-full bg-[#c98a82] px-6 py-3 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92]"
          >
            홈으로
          </button>
        </div>
      </section>
    </main>
  );
}
