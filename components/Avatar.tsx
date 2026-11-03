import { idleFrames } from "@/lib/art";
import type { ArtFrame } from "@/lib/art";
import { ArtFrames } from "./ArtFrames";

export function Avatar({ index = 0, size = 64, name = "캐릭터", className = "", frames }: { index?: number; size?: number; name?: string; className?: string; frames?: ArtFrame[] }) {
  const artwork = frames ?? idleFrames(index);
  return (
    <span
      role="img"
      aria-label={`${name} 캐릭터`}
      className={`avatar-art shrink-0 ${className}`}
      style={{ width: size, height: size * 1.25 }}
    >
      <ArtFrames key={artwork[0].url} frames={artwork} visibleHeight={112} sizes={`${Math.ceil(size * 1.5)}px`} blink={!frames} />
    </span>
  );
}
