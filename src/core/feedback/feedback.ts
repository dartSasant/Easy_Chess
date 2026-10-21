import { playEffect, startAmbience, stopAmbience } from "./audioManager";
import { haptics } from "./haptics";

/** One call = sound + haptic together. */
export const feedback = {
  tap() { playEffect("tap"); haptics.tap(); },
  nav() { playEffect("nav"); haptics.tap(); },
  popup() { playEffect("popup"); haptics.popup(); },
  move() { playEffect("move"); haptics.move(); },
  capture() { playEffect("capture"); haptics.capture(); },
  check() { playEffect("check"); haptics.check(); },
  win() { playEffect("win"); haptics.success(); },
  lose() { playEffect("lose"); haptics.error(); },
  draw() { playEffect("draw"); haptics.tap(); },
  drawOffer() { playEffect("drawOffer"); haptics.popup(); },
  error() { playEffect("error"); haptics.error(); },
  playerFound() { playEffect("playerFound"); haptics.radar(); },
  challenge() { playEffect("challenge"); haptics.challenge(); },
  challengeAccepted() { playEffect("challengeAccepted"); haptics.success(); },
  confetti() { playEffect("confetti"); haptics.success(); },
  newGame() { playEffect("newGame"); haptics.start(); },
};

/**
 * Pick the right sound for a move. Check beats capture, capture beats a plain move.
 * `remote` is true for the opponent's move: a plain move then gets the "your turn" haptic.
 */
export function moveFeedback(info: { capture?: boolean; check?: boolean; remote?: boolean }) {
  if (info.check) feedback.check();
  else if (info.capture) feedback.capture();
  else if (info.remote) {
    playEffect("move");
    haptics.turn();
  } else feedback.move();
}

/** Call when a game ends. `result` is from the local player's point of view. */
export function gameEndFeedback(result: "win" | "lose" | "draw") {
  if (result === "win") feedback.win();
  else if (result === "lose") feedback.lose();
  else feedback.draw();
}

/** Call when a game screen opens: quiet the menu ambience and play the new-game sound. */
export function enterGame() {
  stopAmbience();
  feedback.newGame();
}

/** Call when a game screen closes: bring the menu ambience back. */
export function leaveGame() {
  startAmbience();
}
