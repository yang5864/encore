/**
 * Brand mark registry for the Toss-style tile.
 *  - full: the file is an opaque app icon → it fills the tile with its own background.
 *  - tint: the brand CI color; transparent marks sit on a muted tile mixed from this color.
 */
export type LogoMeta = { full: boolean; tint: string; ext?: "png" | "svg" };

export const LOGOS: Record<string, LogoMeta> = {
  jyp: { full: false, tint: "#1b8ad6" },
  sm: { full: true, tint: "#ffffff" },
  hybe: { full: true, tint: "#ffffff" },
  yg: { full: true, tint: "#111111" },
  starship: { full: false, tint: "#1f3b5c" },
  cube: { full: false, tint: "#d1463b" },
  rbw: { full: false, tint: "#2f8a5b" },
  avex: { full: true, tint: "#004cad" },
  "88rising": { full: true, tint: "#ffffff" },
  sony: { full: false, tint: "#d7000f" },
  melon: { full: true, tint: "#ffffff" },
  billboard: { full: true, tint: "#000000" },
  mama: { full: false, tint: "#e4007f" },
  tossbank: { full: false, tint: "#0064ff" },
  toss: { full: false, tint: "#0064ff" },
  instagram: { full: false, tint: "#ff0069", ext: "svg" },
  youtube: { full: false, tint: "#ff0000", ext: "svg" },
  spotify: { full: false, tint: "#1ed760", ext: "svg" },
};

export const logoMeta = (id: string | null | undefined): LogoMeta | null => (id ? LOGOS[id] ?? null : null);
