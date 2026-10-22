import type { ThemeId } from "../storage/settings";

export type EffectId =
  | "tap"
  | "nav"
  | "popup"
  | "move"
  | "capture"
  | "check"
  | "win"
  | "lose"
  | "draw"
  | "drawOffer"
  | "error"
  | "playerFound"
  | "challenge"
  | "challengeAccepted"
  | "confetti"
  | "newGame";

// Paths are relative to src/core/feedback -> project root /assets
export const EFFECT_SOURCES: Record<EffectId, number> = {
  tap: require("../../../assets/sounds/effects/tap.wav"),
  nav: require("../../../assets/sounds/effects/nav.wav"),
  popup: require("../../../assets/sounds/effects/popup.wav"),
  move: require("../../../assets/sounds/effects/move.wav"),
  capture: require("../../../assets/sounds/effects/capture.wav"),
  check: require("../../../assets/sounds/effects/check.wav"),
  win: require("../../../assets/sounds/effects/win.wav"),
  lose: require("../../../assets/sounds/effects/lose.wav"),
  draw: require("../../../assets/sounds/effects/draw.wav"),
  drawOffer: require("../../../assets/sounds/effects/drawOffer.wav"),
  error: require("../../../assets/sounds/effects/error.wav"),
  playerFound: require("../../../assets/sounds/effects/playerFound.wav"),
  challenge: require("../../../assets/sounds/effects/challenge.wav"),
  challengeAccepted: require("../../../assets/sounds/effects/challengeAccepted.wav"),
  confetti: require("../../../assets/sounds/effects/confetti.wav"),
  newGame: require("../../../assets/sounds/effects/newGame.wav"),
};

// One music loop per theme.
export const AMBIENCE_SOURCES: Record<ThemeId, number> = {
  zen: require("../../../assets/sounds/ambience/ambience_zen.mp3"),
  cozy: require("../../../assets/sounds/ambience/ambience_cozy.mp3"),
  playful: require("../../../assets/sounds/ambience/ambience_playful.mp3"),
  premium: require("../../../assets/sounds/ambience/ambience_premium.mp3"),
  gadget: require("../../../assets/sounds/ambience/ambience_gadget.mp3"),
  ninja: require("../../../assets/sounds/ambience/ambience_ninja.mp3"),
  space: require("../../../assets/sounds/ambience/ambience_space.mp3"),
  jungle: require("../../../assets/sounds/ambience/ambience_jungle.mp3"),
  halloween: require("../../../assets/sounds/ambience/ambience_halloween.mp3"),
};