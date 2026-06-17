"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && !submitting && !success) {
      router.replace("/stories");
    }
  }, [loading, router, submitting, success, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasSupabaseEnv) {
      setError("Supabase 환경변수를 먼저 설정해주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않아요.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(getAuthErrorMessage(error.message));
      return;
    }

    await trackEvent({
      eventName: "signup",
      path: "/signup",
      userId: data.user?.id,
    });

    await supabase.auth.signOut();
    setSuccess("가입이 완료되었어요. 로그인 후 첫 장면을 시작해보세요.");
  };

  if (loading || user) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#151313] px-5 py-12 text-[#f6eee7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(185,122,118,0.24),transparent_32%),radial-gradient(circle_at_20%_82%,rgba(210,173,120,0.14),transparent_34%),linear-gradient(135deg,#151313,#231b1b_54%,#321f20)]" />
      <section className="relative z-10 w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
        <Link href="/" className="text-sm text-[#d2ad78]">
          오늘의 장면
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.03em] text-[#fff8f1]">
          첫 장면을 시작할게요
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#e6d6ca]/75">
          이메일만 있으면 오늘의 이야기를 저장할 수 있어요.
        </p>

        {success ? (
          <div className="mt-8 rounded-2xl border border-[#d2ad78]/25 bg-[#d2ad78]/10 p-5">
            <p className="text-sm leading-6 text-[#f4e1c0]">{success}</p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full justify-center rounded-full bg-[linear-gradient(135deg,#d59a92,#c98a82)] py-4 text-sm font-semibold text-[#1d1414] transition hover:brightness-110"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : (
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
              <span className="mb-2 block text-sm text-[#efe2d8]">
                비밀번호
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#151313]/70 px-4 py-4 text-sm text-[#fff8f1] outline-none transition placeholder:text-[#e6d6ca]/35 focus:border-[#c98a82]/70"
                placeholder="6자 이상 입력해주세요"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#efe2d8]">
                비밀번호 확인
              </span>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#151313]/70 px-4 py-4 text-sm text-[#fff8f1] outline-none transition placeholder:text-[#e6d6ca]/35 focus:border-[#c98a82]/70"
                placeholder="한 번 더 입력해주세요"
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
              {submitting ? "가입 중..." : "회원가입"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#e6d6ca]/68">
          이미 계정이 있다면{" "}
          <Link href="/login" className="font-semibold text-[#d2ad78]">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
