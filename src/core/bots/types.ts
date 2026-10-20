import type { Color, MoveInput } from "@/core/game";

export type Bot = {
  level: number;
  name: string;
  /** Returns the bot's move for this position, or null if it has none. */
  chooseMove(fen: string): Promise<MoveInput | null>;
  /** Would this bot accept a draw offer here? It only accepts when it is clearly losing. */
  acceptsDraw(fen: string, botColor: Color): boolean;
};

export type BotProfile = {
  level: number;
  name: string;
  /** Search depth in plies. */
  depth: number;
  /** Chance (0 to 1) to ignore the search and play a random legal move. */
  blunderChance: number;
  /** Random noise added to each move's score, in centipawns. Bigger = more mistakes. */
  noise: number;
  /** Look at captures after the last ply, which avoids silly trades. */
  quiescence: boolean;
  /** Longest the search may run, in milliseconds. */
  timeMs: number;
  /** The bot waits at least this long before moving, so it feels natural. */
  minThinkMs: number;
};