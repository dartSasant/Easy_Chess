import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

export type ThemeId =
  | "zen"
  | "cozy"
  | "playful"
  | "premium"
  | "gadget"
  | "ninja"
  | "space"
  | "jungle"
  | "halloween";
export const THEME_IDS: ThemeId[] = [
  "zen",
  "cozy",
  "playful",
  "premium",
  "gadget",
  "ninja",
  "space",
  "jungle",
  "halloween",
];

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** The mascot peeks in from the screen edges (shake or at random). */
  mascotEnabled: boolean;
  effectsVolume: number; // 0..1
  ambienceVolume: number; // 0..1
  themeId: ThemeId;
};

const KEY = "easychess.settings.v1";

const DEFAULTS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  mascotEnabled: true,
  effectsVolume: 0.8,
  ambienceVolume: 0.35,
  themeId: "zen",
};

const clamp01 = (n: unknown, fallback: number) =>
  typeof n === "number" && isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;

function load(): Settings {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return { ...DEFAULTS };
    // Old saves may still contain a "language" key. It is simply ignored.
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      soundEnabled:
        typeof p.soundEnabled === "boolean"
          ? p.soundEnabled
          : DEFAULTS.soundEnabled,
      hapticsEnabled:
        typeof p.hapticsEnabled === "boolean"
          ? p.hapticsEnabled
          : DEFAULTS.hapticsEnabled,
      mascotEnabled:
        typeof p.mascotEnabled === "boolean"
          ? p.mascotEnabled
          : DEFAULTS.mascotEnabled,
      effectsVolume: clamp01(p.effectsVolume, DEFAULTS.effectsVolume),
      ambienceVolume: clamp01(p.ambienceVolume, DEFAULTS.ambienceVolume),
      themeId: THEME_IDS.includes(p.themeId as ThemeId)
        ? (p.themeId as ThemeId)
        : DEFAULTS.themeId,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: Settings = load();
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return state;
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  try {
    Storage.setItemSync(KEY, JSON.stringify(state));
  } catch {
    // storage failure must never break the app
  }
  listeners.forEach((l) => l());
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React hook: re-renders when any setting changes. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}
