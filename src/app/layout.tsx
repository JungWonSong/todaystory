import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 장면",
  description:
    "읽기만 하던 이야기 속으로 들어가, 주인공의 한마디를 직접 써보는 감정형 스토리 서비스.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#0f0c0c] text-[#fff7ea]">
        <AnalyticsTracker />
        <div className="min-h-screen bg-[#0f0c0c] text-[#fff7ea]">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
