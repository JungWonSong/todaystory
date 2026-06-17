import Link from "next/link";
import { HomeLink } from "@/components/HomeLink";

const contactEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "support@example.com";

const footerLinks = [
  { label: "이야기 보기", href: "/stories" },
  { label: "내 장면", href: "/mypage" },
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "문의하기", href: `mailto:${contactEmail}` },
];

export function Footer() {
  return (
    <footer className="border-t border-[#ead7bd]/10 bg-[#0f0c0c] px-5 py-10 text-[#f4e7d4]/70 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-9 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <HomeLink
            className="text-lg font-semibold tracking-[-0.02em] text-[#fff7ea] transition hover:text-[#d9978f]"
          >
            오늘의 장면
          </HomeLink>
          <p className="mt-4 break-keep text-sm leading-7">
            이야기 속 한 장면에 들어가, 다음 말을 직접 써보세요.
          </p>
          <p className="mt-5 break-keep text-xs leading-6 text-[#f4e7d4]/45">
            오늘의 장면은 사용자가 입력한 대사를 바탕으로 이야기를 이어가는
            창작형 콘텐츠 서비스입니다.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm md:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition hover:text-[#d9978f]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-9 flex max-w-6xl flex-col gap-2 border-t border-[#ead7bd]/10 pt-6 text-xs text-[#f4e7d4]/42 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 오늘의 장면. All rights reserved.</p>
        <p className="break-keep">
          조용히 읽고, 천천히 쓰는 하루 끝의 장면.
        </p>
      </div>
    </footer>
  );
}
