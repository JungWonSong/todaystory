import { HomeLink } from "@/components/HomeLink";

const terms = [
  "오늘의 장면은 사용자가 이야기 속 주인공이 되어 대사를 입력하고 장면을 이어가는 콘텐츠 서비스입니다.",
  "서비스 이용 중 생성·저장되는 장면은 사용자의 계정에 연결될 수 있습니다.",
  "타인의 권리를 침해하거나 불쾌감을 주는 내용을 입력하지 말아주세요.",
  "본 약관은 정식 서비스 운영 전까지 보완될 수 있습니다.",
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#151313] px-5 py-12 text-[#f6eee7] sm:px-8 lg:px-12">
      <section className="mx-auto max-w-3xl">
        <HomeLink className="text-sm text-[#d2ad78]">
          오늘의 장면
        </HomeLink>

        <p className="mt-12 text-sm font-medium text-[#d2ad78]">
          서비스 안내
        </p>
        <h1 className="mt-4 break-keep text-4xl font-semibold tracking-[-0.04em] text-[#fff8f1] md:text-6xl">
          이용약관
        </h1>
        <p className="mt-5 break-keep text-sm leading-7 text-[#e6d6ca]/64">
          아래 내용은 정식 약관 마련 전까지 사용하는 MVP 안내이며, 법률
          자문을 대체하지 않습니다.
        </p>

        <div className="mt-10 space-y-4">
          {terms.map((item, index) => (
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
