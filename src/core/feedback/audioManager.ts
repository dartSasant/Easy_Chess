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
import {
  AMBIENCE_SOURCE,
  EFFECT_SOURCES,
  STARTUP_SOURCES,
  type EffectId,
} from "./sounds";

/** Menu ambience loop is switched off. Set to true to bring it back. */
const AMBIENCE_ENABLED = false;

let initPromise: Promise<void> | null = null;
let appActive = true;
let ambienceWanted = false;
let startupPlaying = false;
let startupDone = false;

const effects: Partial<Record<EffectId, AudioPlayer>> = {};
let ambience: AudioPlayer | null = null;
let startup: AudioPlayer | null = null;

function stopStartup() {
  const p = startup;
  startup = null;
  startupPlaying = false;
  if (!p) return;
  setTimeout(() => {
    try {
      p.pause();
      p.release();
    } catch {}
  }, 0);
}

function ensureAmbience() {
  if (!AMBIENCE_ENABLED) return;
  const s = getSettings();
  if (!ambienceWanted || !s.soundEnabled || !appActive || startupPlaying)
    return;
  try {
    if (!ambience) {
      ambience = createAudioPlayer(AMBIENCE_SOURCE);
      ambience.loop = true;
    }
    ambience.volume = s.ambienceVolume;
    ambience.play();
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
    stopStartup();
    pauseAmbience();
    return;
  }
  try {
    if (ambience) ambience.volume = s.ambienceVolume;
  } catch {}
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

/** Theme startup sound; the menu ambience (if enabled) starts after it finishes. */
export function playStartup(themeId?: ThemeId) {
  const s = getSettings();
  if (!s.soundEnabled) return;
  stopStartup();
  try {
    const p = createAudioPlayer(STARTUP_SOURCES[themeId ?? s.themeId]);
    startup = p;
    startupPlaying = true;
    p.volume = s.effectsVolume;
    p.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish && startup === p) {
        stopStartup();
        ensureAmbience();
      }
    });
    p.play();
  } catch {
    startupPlaying = false;
  }
}

/** Home screen calls this on mount: startup sound once per app launch. */
export function playStartupOnce() {
  if (startupDone) return;
  startupDone = true;
  void initAudio().then(() => {
    playStartup();
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
