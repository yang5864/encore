import type { NextConfig } from "next";

const YEAR = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 최적화된 이미지를 엣지·브라우저에 1년 캐시 (원본 아트는 버전 폴더로 관리)
    minimumCacheTTL: 31536000,
    formats: ["image/webp"],
  },
  async headers() {
    // public/ 정적 자산은 파일명이 바뀌지 않으면 내용도 바뀌지 않는다: 1년 캐시
    return ["/fonts/:path*", "/logos/:path*", "/art-v3/:path*", "/art-v4/:path*", "/scenes/:path*", "/sprites.webp", "/favicon.svg"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: YEAR }],
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
