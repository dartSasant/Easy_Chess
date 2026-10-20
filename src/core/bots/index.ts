import { Chess } from "chess.js";

import type { Color } from "@/core/game";
import { evaluate } from "./evaluate";
import { BOSS_LEVEL, BOT_COUNT, BOT_PROFILES } from "./levels";
import { searchBestMove } from "./search";
import type { Bot, BotProfile } from "./types";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The bot accepts a draw when it is about three pawns down or worse. */
const DRAW_ACCEPT_BELOW = -300;

export function getBotProfile(level: number): BotProfile {
  const clamped = Math.min(Math.max(Math.round(level), 1), BOT_COUNT);
  return BOT_PROFILES[clamped - 1];
}

export function getBot(level: number): Bot {
  const profile = getBotProfile(level);
  return {
    level: profile.level,
    name: profile.name,
    async chooseMove(fen) {
      const startedAt = Date.now();
      const move = await searchBestMove(fen, profile);
      const wait = profile.minThinkMs - (Date.now() - startedAt);
      if (wait > 0) await sleep(wait);
      return move;
    },
    acceptsDraw(fen, botColor: Color) {
      const chess = new Chess(fen);
      const score = evaluate(chess); // from the side to move
      const botScore = chess.turn() === botColor ? score : -score;
      return botScore <= DRAW_ACCEPT_BELOW;
    },
  };
}

export { BOSS_LEVEL, BOT_COUNT, BOT_PROFILES };
export type { Bot, BotProfile };