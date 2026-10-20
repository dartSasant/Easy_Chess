import type { BotProfile } from "./types";

/** Beating this bot removes ads. */
export const BOSS_LEVEL = 10;

export const BOT_PROFILES: BotProfile[] = [
  { level: 1, name: "Rex", depth: 1, blunderChance: 0.85, noise: 300, quiescence: false, timeMs: 1500, minThinkMs: 500 },
  { level: 2, name: "Sam", depth: 1, blunderChance: 0.7, noise: 250, quiescence: false, timeMs: 1500, minThinkMs: 500 },
  { level: 3, name: "Pete", depth: 1, blunderChance: 0.55, noise: 200, quiescence: false, timeMs: 1500, minThinkMs: 600 },
  { level: 4, name: "Cleo", depth: 1, blunderChance: 0.4, noise: 150, quiescence: false, timeMs: 1500, minThinkMs: 600 },
  { level: 5, name: "A girl", depth: 2, blunderChance: 0.3, noise: 120, quiescence: false, timeMs: 1500, minThinkMs: 700 },
  { level: 6, name: "Ben", depth: 2, blunderChance: 0.22, noise: 90, quiescence: false, timeMs: 1500, minThinkMs: 700 },
  { level: 7, name: "Rosa", depth: 2, blunderChance: 0.15, noise: 70, quiescence: true, timeMs: 2000, minThinkMs: 800 },
  { level: 8, name: "Tom", depth: 2, blunderChance: 0.1, noise: 50, quiescence: true, timeMs: 2000, minThinkMs: 800 },
  { level: 9, name: "Sia", depth: 2, blunderChance: 0.06, noise: 30, quiescence: true, timeMs: 2000, minThinkMs: 900 },
  { level: 10, name: "ADs", depth: 2, blunderChance: 0.03, noise: 15, quiescence: true, timeMs: 2500, minThinkMs: 900 },
  { level: 11, name: "Ivan", depth: 3, blunderChance: 0.02, noise: 10, quiescence: true, timeMs: 2500, minThinkMs: 900 },
  { level: 12, name: "Quinn", depth: 3, blunderChance: 0, noise: 0, quiescence: true, timeMs: 3000, minThinkMs: 900 },
  { level: 13, name: "Max", depth: 4, blunderChance: 0, noise: 0, quiescence: true, timeMs: 3500, minThinkMs: 900 },
  { level: 14, name: "Chitra", depth: 4, blunderChance: 0, noise: 0, quiescence: true, timeMs: 4000, minThinkMs: 900 },
  { level: 15, name: "Indra", depth: 5, blunderChance: 0, noise: 0, quiescence: true, timeMs: 5000, minThinkMs: 900 },
];

export const BOT_COUNT = BOT_PROFILES.length;