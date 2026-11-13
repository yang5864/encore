import type { SVGProps } from "react";

/**
 * 앱 전체가 쓰는 선 아이콘 한 벌. 24px 격자, 1.75 선 굵기, 둥근 끝, 색은 currentColor.
 * 이모지를 아이콘 자리에 쓰지 않는다: 플랫폼마다 모양이 달라지고 다크 모드 글자색을 따르지 않는다.
 */
export type IconName =
  | "trophy" | "target" | "chart" | "wallet" | "bag" | "chevron-right" | "check"
  | "sprout" | "medal" | "droplet" | "sparkle" | "alert" | "heart";

const PATHS: Record<IconName, string[]> = {
  trophy: ["M8 4h8v5a4 4 0 0 1-8 0V4Z", "M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11", "M16 6h3v1.5A3.5 3.5 0 0 1 15.5 11", "M12 13v4", "M8.5 20h7", "M9.5 17h5v3h-5z"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M12 12h.01"],
  chart: ["M4 20h16", "M7 16v-5", "M12 16V7", "M17 16v-8"],
  wallet: ["M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3", "M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z", "M16 13.5h.01"],
  bag: ["M6 8h12l-1 12H7L6 8Z", "M9 10V7a3 3 0 0 1 6 0v3"],
  "chevron-right": ["M9 6l6 6-6 6"],
  check: ["M5 12.5l4.5 4.5L19 7"],
  sprout: ["M12 20v-8", "M12 12c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z", "M12 14c0-3 2-5.5 6-5.5 0 3-2 5.5-6 5.5Z"],
  medal: ["M8 3l2.5 6", "M16 3l-2.5 6", "M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z", "M12 13v4"],
  droplet: ["M12 3.5c3 3.6 5.5 6.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.9 5.5-9.5Z"],
  sparkle: ["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z", "M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16Z"],
  alert: ["M12 4l9 16H3l9-16Z", "M12 10v4", "M12 17h.01"],
  heart: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"],
};

export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" {...rest}>
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
