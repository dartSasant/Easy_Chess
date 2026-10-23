import Storage from "expo-sqlite/kv-store";

import { BOSS_COUNT } from "@/core/bots/bosses";

const KEY = "bossesBeaten";

export function loadBossBeaten(): number[] {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number => Number.isInteger(n) && n >= 1 && n <= BOSS_COUNT,
    );
  } catch {
    return [];
  }
}

export function isBossUnlocked(index: number, beaten: number[]): boolean {
  return index <= 1 || beaten.includes(index - 1);
}

export function markBossBeaten(beaten: number[], index: number): number[] {
  if (beaten.includes(index)) return beaten;
  const next = [...beaten, index].sort((a, b) => a - b);
  try {
    Storage.setItemSync(KEY, JSON.stringify(next));
  } catch {
    // Not saved. Progress still counts until the app closes.
  }
  return next;
}
