export function Avatar({ index = 0, size = 64, name = "캐릭터", className = "" }: { index?: number; size?: number; name?: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${name} 캐릭터`}
      className={`sprite shrink-0 ${className}`}
      style={{ width: size, height: size * 1.25, backgroundPosition: `${(index % 6) * 20}% 50%` }}
    />
  );
}
