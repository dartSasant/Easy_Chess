import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { AppState } from "react-native";

import {
  getSettings,
  subscribeSettings,
  type ThemeId,
} from "../storage/settings";
import { AMBIENCE_SOURCES, EFFECT_SOURCES, type EffectId } from "./sounds";

let initPromise: Promise<void> | null = null;
let appActive = true;
let ambienceWanted = false;
let launchDone = false;

const effects: Partial<Record<EffectId, AudioPlayer>> = {};
let ambience: AudioPlayer | null = null;
let ambienceTheme: ThemeId | null = null;

/**
 * Plays the current theme's music loop. When the theme changed, a fresh player is created
 * for the new track and the old one is stopped and released (swapping the track on one
 * player is not reliable on every device).
 */
function ensureAmbience() {
  const s = getSettings();
  if (!ambienceWanted || !s.soundEnabled || !appActive) return;
  try {
    if (!ambience || ambienceTheme !== s.themeId) {
      const old = ambience;
      const next = createAudioPlayer(AMBIENCE_SOURCES[s.themeId]);
      next.loop = true;
      ambience = next;
      ambienceTheme = s.themeId;
      if (old) {
        try {
          old.pause();
          old.remove();
        } catch {}
      }
    }
    if (ambience) {
      ambience.volume = s.ambienceVolume;
      ambience.play();
    }
  } catch {}
}

function pauseAmbience() {
  try {
    ambience?.pause();
  } catch {}
}

function onSettingsChange() {
  const s = getSettings();
  if (!s.soundEnabled) {
    pauseAmbience();
    return;
  }
  try {
    if (ambience) ambience.volume = s.ambienceVolume;
  } catch {}
  // A theme change lands here and switches the music to the new theme's track.
  ensureAmbience();
}

async function setup() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false, // respect the phone's silent mode
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
  } catch {}
  (Object.keys(EFFECT_SOURCES) as EffectId[]).forEach((id) => {
    try {
      effects[id] = createAudioPlayer(EFFECT_SOURCES[id]);
    } catch {}
  });
  AppState.addEventListener("change", (st) => {
    appActive = st === "active";
    if (!appActive) pauseAmbience();
    else ensureAmbience();
  });
  subscribeSettings(onSettingsChange);
}

/** Call once when the app starts (src/app/_layout.tsx). Safe to call again. */
export function initAudio(): Promise<void> {
  if (!initPromise) initPromise = setup();
  return initPromise;
}

export function playEffect(id: EffectId) {
  const s = getSettings();
  if (!s.soundEnabled) return;
  const p = effects[id];
  if (!p) return;
  try {
    p.volume = s.effectsVolume;
    p.seekTo(0);
    p.play();
  } catch {}
}

/** Called when a theme is picked. No startup sound anymore: just make sure the theme's music is playing. */
export function playStartup(_themeId?: ThemeId) {
  startAmbience();
}

/** Home screen calls this on mount: starts the music once per app launch. */
export function playStartupOnce() {
  if (launchDone) return;
  launchDone = true;
  void initAudio().then(() => {
    startAmbience();
  });
}

/** Menus call this when they appear. */
export function startAmbience() {
  ambienceWanted = true;
  ensureAmbience();
}

/** Games call this when they start, so the board stays calm. */
export function stopAmbience() {
  ambienceWanted = false;
  pauseAmbience();
}