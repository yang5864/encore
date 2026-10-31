import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENCORE — 연습생부터 레전드까지",
  description:
    "14살 무소속 지망생에서 시작하는 나만의 K-POP 아이돌 인생. 기획사 오디션, 데뷔, 음악방송 1위, 대상까지 반기마다 쌓이는 선택이 커리어가 됩니다.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#17171c" },
  ],
};

// 저장된 테마를 첫 페인트 전에 적용해 깜빡임을 막는다.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("encore2:theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <Script id="encore-theme" strategy="beforeInteractive">{THEME_SCRIPT}</Script>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
