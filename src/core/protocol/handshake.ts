import type { Color } from "@/core/game";

export function makePeerId(): string {
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  }
  return id;
}

export function randomRoll(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/** Higher roll plays White. Returns null on a tie, so both phones must roll again. */
export function pickColor(myRoll: number, opponentRoll: number): Color | null {
  if (myRoll === opponentRoll) return null;
  return myRoll > opponentRoll ? "w" : "b";
}