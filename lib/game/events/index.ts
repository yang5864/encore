import type { GameEventDef } from "../types.ts";
import { TRAINEE_EVENTS } from "./trainee.ts";
import { IDOL_EVENTS } from "./idol.ts";

export const EVENTS: GameEventDef[] = [...TRAINEE_EVENTS, ...IDOL_EVENTS];
export const eventById = (id: string) => EVENTS.find((e) => e.id === id) ?? null;

export const SCENES = [
  "advert", "album", "audition", "awards", "birthday", "challenge", "clinic", "coachella", "contract", "dance", "debut", "donation", "dorm", "drama", "family", "fansign", "festival", "livestream", "mc", "military-concert", "military", "press", "rest", "retirement", "school", "songwriting", "survival", "tour", "variety", "vocal", "wedding", "youtube",
  "grammy", "stadium", "isac", "sns-open", "military-band", "practice",
] as const;
export type Scene = (typeof SCENES)[number];
export const scenePath = (scene: string) => `/scenes/${scene}.webp`;
