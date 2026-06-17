import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 장면",
  description:
    "읽는 이야기가 아니라, 내가 들어가는 장면. 주인공의 대사를 직접 쓰는 감정형 인터랙티브 소설 서비스.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
