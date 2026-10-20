import Storage from "expo-sqlite/kv-store";

import { BOSS_LEVEL, BOT_COUNT } from "@/core/bots/levels";

const KEY = "campaignBeaten";

/** Bots 1..FIRST_UNLOCKED are open from the start. Change to 15 to test everything. */
const FIRST_UNLOCKED = 2;

export function loadBeaten(): number[] {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number => Number.isInteger(n) && n >= 1 && n <= BOT_COUNT,
    );
  } catch {
    return [];
  }
}

function saveBeaten(beaten: number[]): void {
  try {
    Storage.setItemSync(KEY, JSON.stringify(beaten));
  } catch {
    // Not saved. Progress still counts until the app closes.
  }
}

export function isUnlocked(level: number, beaten: number[]): boolean {
  return level <= FIRST_UNLOCKED || beaten.includes(level - 1);
}

/** Ads are removed once the boss is beaten. */
export function adsRemoved(beaten: number[]): boolean {
  return beaten.includes(BOSS_LEVEL);
}

/** Records a win and returns the new list. */
export function markBeaten(beaten: number[], level: number): number[] {
  if (beaten.includes(level)) return beaten;
  const next = [...beaten, level].sort((a, b) => a - b);
  saveBeaten(next);
  return next;
}