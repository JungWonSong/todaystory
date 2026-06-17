"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { goHomeWithReload } from "@/components/HomeLink";
import { useAuth } from "@/hooks/useAuth";

export function AuthNav() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const isAdmin =
    Boolean(user?.email) &&
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleStart = () => {
    router.push(user ? "/stories" : "/login");
  };

  const handleSignOut = async () => {
    await signOut();
    goHomeWithReload();
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {loading ? (
        <span className="hidden text-sm text-[#e3d4ca]/60 sm:inline">
          확인 중...
        </span>
      ) : user ? (
        <>
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-full border border-[#d2ad78]/25 bg-[#d2ad78]/10 px-3 py-2 text-sm text-[#f4e1c0] backdrop-blur-md transition hover:bg-[#d2ad78]/15 sm:inline-flex sm:px-4"
            >
              관리자
            </Link>
          ) : null}
          <Link
            href="/mypage"
            className="rounded-full border border-[#f3d8bf]/20 bg-white/5 px-3 py-2 text-sm text-[#f6eee7] backdrop-blur-md transition hover:bg-white/10 sm:px-4"
          >
            내 장면
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-[#c98a82] px-3 py-2 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92] sm:px-4"
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-full border border-[#f3d8bf]/20 bg-white/5 px-3 py-2 text-sm text-[#f6eee7] backdrop-blur-md transition hover:bg-white/10 sm:px-4"
          >
            로그인
          </Link>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-[#c98a82] px-3 py-2 text-sm font-semibold text-[#1d1414] transition hover:bg-[#d99b92] sm:px-4"
          >
            <span className="hidden sm:inline">첫 장면 들어가기</span>
            <span className="sm:hidden">들어가기</span>
          </button>
        </>
      )}
    </div>
  );
}
