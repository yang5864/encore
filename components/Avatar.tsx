import { idleFrames } from "@/lib/art";
import { ArtFrames } from "./ArtFrames";

export function Avatar({ index = 0, size = 64, name = "캐릭터", className = "" }: { index?: number; size?: number; name?: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${name} 캐릭터`}
      className={`avatar-art shrink-0 ${className}`}
      style={{ width: size, height: size * 1.25 }}
    >
      <ArtFrames key={index} frames={idleFrames(index)} visibleHeight={112} sizes={`${Math.ceil(size * 1.5)}px`} />
    </span>
  );
}
