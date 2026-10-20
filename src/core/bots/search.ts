import { Chess, type Move } from "chess.js";

import type { MoveInput, PromotionPiece } from "@/core/game";
import { evaluate, pieceValue } from "./evaluate";
import type { BotProfile } from "./types";

const MATE = 100000;
const INF = 1000000;
const MAX_QUIESCENCE_DEPTH = 6;

type Ctx = {
  nodes: number;
  deadline: number;
  stopped: boolean;
  quiescence: boolean;
};

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function toInput(m: Move): MoveInput {
  return m.promotion
    ? { from: m.from, to: m.to, promotion: m.promotion as PromotionPiece }
    : { from: m.from, to: m.to };
}

function play(chess: Chess, m: Move) {
  chess.move(
    m.promotion ? { from: m.from, to: m.to, promotion: m.promotion } : { from: m.from, to: m.to },
  );
}

/** Captures first (most valuable victim, cheapest attacker), then promotions. */
function orderMoves(moves: Move[]): Move[] {
  const score = (m: Move) =>
    (m.captured ? 10 * pieceValue(m.captured) - pieceValue(m.piece) : 0) +
    (m.promotion ? 800 : 0);
  return moves.sort((a, b) => score(b) - score(a));
}

function timeUp(ctx: Ctx): boolean {
  if ((++ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) ctx.stopped = true;
  return ctx.stopped;
}

function quiesce(
  chess: Chess,
  alpha: number,
  beta: number,
  ctx: Ctx,
  ply: number,
  qd: number,
): number {
  if (timeUp(ctx)) return 0;

  const all = chess.moves({ verbose: true });
  if (all.length === 0) return chess.isCheck() ? -MATE + ply : 0;

  const stand = evaluate(chess);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd >= MAX_QUIESCENCE_DEPTH) return alpha;

  const tactical = orderMoves(all.filter((m) => m.captured || m.promotion));
  for (const m of tactical) {
    play(chess, m);
    const score = -quiesce(chess, -beta, -alpha, ctx, ply + 1, qd + 1);
    chess.undo();
    if (ctx.stopped) return 0;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ctx: Ctx,
  ply: number,
): number {
  if (timeUp(ctx)) return 0;

  if (depth <= 0) {
    return ctx.quiescence ? quiesce(chess, alpha, beta, ctx, ply, 0) : evaluate(chess);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) return chess.isCheck() ? -MATE + ply : 0;

  for (const m of moves) {
    play(chess, m);
    const score = -negamax(chess, depth - 1, -beta, -alpha, ctx, ply + 1);
    chess.undo();
    if (ctx.stopped) return 0;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

export async function searchBestMove(fen: string, profile: BotProfile): Promise<MoveInput | null> {
  const chess = new Chess(fen);
  const startedAt = Date.now();

  let rootMoves = orderMoves(chess.moves({ verbose: true }));
  if (rootMoves.length === 0) return null;
  if (rootMoves.length === 1) return toInput(rootMoves[0]);

  // Weak bots sometimes just play any legal move.
  if (Math.random() < profile.blunderChance) {
    return toInput(rootMoves[Math.floor(Math.random() * rootMoves.length)]);
  }

  // Every bot takes a checkmate in one when it sees it.
  for (const m of rootMoves) {
    play(chess, m);
    const mated = chess.isCheckmate();
    chess.undo();
    if (mated) return toInput(m);
  }

  const ctx: Ctx = {
    nodes: 0,
    deadline: startedAt + profile.timeMs,
    stopped: false,
    quiescence: profile.quiescence,
  };
  let best = rootMoves[0];

  for (let depth = 1; depth <= profile.depth; depth++) {
    const scored: { move: Move; score: number }[] = [];
    let alpha = -INF;

    for (const m of rootMoves) {
      play(chess, m);
      // With noise we need every move's real score, so the root window stays open.
      const rootAlpha = profile.noise > 0 ? -INF : alpha;
      const score = -negamax(chess, depth - 1, -INF, -rootAlpha, ctx, 1);
      chess.undo();
      if (ctx.stopped) break;

      scored.push({ move: m, score });
      if (score > alpha) alpha = score;
      await yieldToUi(); // keep the UI responsive between root moves
    }

    if (ctx.stopped || scored.length < rootMoves.length) break; // discard the unfinished depth

    let bestScore = -Infinity;
    for (const s of scored) {
      const noisy = s.score + (Math.random() * 2 - 1) * profile.noise;
      if (noisy > bestScore) {
        bestScore = noisy;
        best = s.move;
      }
    }

    // Search the previous best move first next time.
    rootMoves = [best, ...rootMoves.filter((m) => m !== best)];
    if (alpha >= MATE - 100) break; // found a forced mate
  }

  if (__DEV__) {
    console.log(
      `[bot ${profile.level}] ${ctx.nodes} nodes in ${Date.now() - startedAt} ms${ctx.stopped ? " (time limit)" : ""}`,
    );
  }
  return toInput(best);
}