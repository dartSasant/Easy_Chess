import type { ThemeId } from "../storage/settings";

export type EffectId =
  | "tap" | "nav" | "popup"
  | "move" | "capture" | "check"
  | "win" | "lose" | "draw" | "drawOffer"
  | "error" | "playerFound" | "challenge" | "challengeAccepted"
  | "confetti" | "newGame";

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

export const STARTUP_SOURCES: Record<ThemeId, number> = {
  zen: require("../../../assets/sounds/startup/startup_zen.wav"),
  cozy: require("../../../assets/sounds/startup/startup_cozy.wav"),
  playful: require("../../../assets/sounds/startup/startup_playful.wav"),
  premium: require("../../../assets/sounds/startup/startup_premium.wav"),
  gadget: require("../../../assets/sounds/startup/startup_gadget.wav"),
  ninja: require("../../../assets/sounds/startup/startup_ninja.wav"),
};

export const AMBIENCE_SOURCE: number = require("../../../assets/sounds/ambience/ambience_nature.wav");