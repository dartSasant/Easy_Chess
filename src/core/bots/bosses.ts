import type { ThemeId } from "@/core/storage/settings";
import type { BotProfile } from "./types";

export type BossDef = {
  /** 1..BOSS_COUNT. Boss 1 is open from the start, beating a boss opens the next. */
  index: number;
  themeId: ThemeId;
  name: string;
  profile: BotProfile;
};

const p = (
  index: number,
  name: string,
  depth: number,
  blunderChance: number,
  noise: number,
  timeMs: number,
): BotProfile => ({
  level: 100 + index,
  name,
  depth,
  blunderChance,
  noise,
  quiescence: true,
  timeMs,
  minThinkMs: 900,
});

// Tune difficulty here. Bosses 1-3 sit around the strength of bots 10-11, then each one is a bit harder.
export const BOSSES: BossDef[] = [
  { index: 1, themeId: "zen", name: "Zenji", profile: p(1, "Zenji", 2, 0.03, 15, 2500) },
  { index: 2, themeId: "cozy", name: "Bruno", profile: p(2, "Bruno", 2, 0.02, 10, 2500) },
  { index: 3, themeId: "playful", name: "Bloop", profile: p(3, "Bloop", 3, 0.02, 10, 2500) },
  { index: 4, themeId: "premium", name: "Hoot", profile: p(4, "Hoot", 3, 0, 0, 3000) },
  { index: 5, themeId: "gadget", name: "Gizmo", profile: p(5, "Gizmo", 4, 0.01, 20, 3500) },
  { index: 6, themeId: "ninja", name: "Kage", profile: p(6, "Kage", 4, 0, 5, 3500) },
  { index: 7, themeId: "space", name: "Zorp", profile: p(7, "Zorp", 4, 0, 0, 4000) },
  { index: 8, themeId: "jungle", name: "Koko", profile: p(8, "Koko", 5, 0, 10, 4500) },
  { index: 9, themeId: "halloween", name: "Boo", profile: p(9, "Boo", 5, 0, 0, 5000) },
];

export const BOSS_COUNT = BOSSES.length;

export function getBossProfile(index: number): BotProfile {
  const i = Math.min(Math.max(Math.round(index), 1), BOSS_COUNT);
  return BOSSES[i - 1].profile;
}
