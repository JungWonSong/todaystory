import Link from "next/link";

const privacyItems = [
  "회원가입 및 로그인 과정에서 이메일 또는 소셜 로그인 식별 정보를 처리할 수 있습니다.",
  "서비스 이용 기록, 스토리 시작 기록, 대사 입력 횟수 등 기본적인 이용 통계를 저장할 수 있습니다.",
  "사용자가 입력한 장면 내용은 이어서 보기 기능 제공을 위해 저장될 수 있습니다.",
  "개인정보 관련 문의는 푸터의 문의 이메일로 연락할 수 있습니다.",
  "본 방침은 정식 서비스 운영 전까지 보완될 수 있습니다.",
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#151313] px-5 py-12 text-[#f6eee7] sm:px-8 lg:px-12">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[#d2ad78]">
          오늘의 장면
        </Link>

        <p className="mt-12 text-sm font-medium text-[#d2ad78]">
          개인정보 안내
        </p>
        <h1 className="mt-4 break-keep text-4xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
          개인정보처리방침
        </h1>
        <p className="mt-5 break-keep text-sm leading-7 text-[#e6d6ca]/64">
          아래 내용은 정식 방침 마련 전까지 사용하는 MVP 안내이며, 법률
          자문을 대체하지 않습니다.
        </p>

        <div className="mt-10 space-y-4">
          {privacyItems.map((item, index) => (
            <article
              key={item}
              className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"
            >
              <p className="mb-3 text-xs font-medium text-[#d2ad78]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="break-keep text-base leading-8 text-[#f4e7d4]/84">
                {item}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
