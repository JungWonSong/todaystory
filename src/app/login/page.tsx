"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { HomeLink } from "@/components/HomeLink";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/stories");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!hasSupabaseEnv) {
      setError("Supabase 환경변수를 먼저 설정해주세요.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(getAuthErrorMessage(error.message));
      return;
    }

    await trackEvent({
      eventName: "login",
      path: "/login",
      userId: data.user?.id,
    });

    router.replace("/stories");
  };

  if (loading || user) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#151313] px-5 py-12 text-[#f6eee7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(185,122,118,0.24),transparent_32%),radial-gradient(circle_at_20%_82%,rgba(210,173,120,0.14),transparent_34%),linear-gradient(135deg,#151313,#231b1b_54%,#321f20)]" />
      <section className="relative z-10 w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
        <HomeLink className="text-sm text-[#d2ad78]">
          오늘의 장면
        </HomeLink>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.03em] text-[#fff8f1]">
          다시, 내 장면으로
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#e6d6ca]/75">
          오늘의 이야기를 이어가려면 로그인해주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-[#efe2d8]">이메일</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#151313]/70 px-4 py-4 text-sm text-[#fff8f1] outline-none transition placeholder:text-[#e6d6ca]/35 focus:border-[#c98a82]/70"
              placeholder="name@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#efe2d8]">비밀번호</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#151313]/70 px-4 py-4 text-sm text-[#fff8f1] outline-none transition placeholder:text-[#e6d6ca]/35 focus:border-[#c98a82]/70"
              placeholder="비밀번호를 입력해주세요"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-[#c98a82]/25 bg-[#c98a82]/10 px-4 py-3 text-sm text-[#f3c4bf]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[linear-gradient(135deg,#d59a92,#c98a82)] py-4 text-sm font-semibold text-[#1d1414] shadow-[0_18px_60px_rgba(201,138,130,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#e6d6ca]/68">
          아직 계정이 없다면{" "}
          <Link href="/signup" className="font-semibold text-[#d2ad78]">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}
