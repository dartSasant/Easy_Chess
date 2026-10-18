import { Chess, type Square as ChessSquare } from 'chess.js';

import { getStatus } from './status';
import type {
  Color,
  GameStatus,
  MoveInput,
  MoveRecord,
  MoveResult,
  Piece,
  PromotionPiece,
  Square,
} from './types';

export class ChessGame {
  private chess: Chess;
  private records: MoveRecord[] = [];

  constructor() {
    this.chess = new Chess();
  }

  /** Plays a move. Illegal moves return an error result and never throw. */
  move(input: MoveInput): MoveResult {
    try {
      const color = this.chess.turn();
      const m = this.chess.move(
        input.promotion
          ? { from: input.from, to: input.to, promotion: input.promotion }
          : { from: input.from, to: input.to },
      );
      const record: MoveRecord = {
        ply: this.records.length + 1,
        color,
        from: m.from,
        to: m.to,
        promotion: m.promotion as PromotionPiece | undefined,
        san: m.san,
      };
      this.records.push(record);
      return { ok: true, move: record };
    } catch {
      return { ok: false, error: 'Illegal move' };
    }
  }

  /** Squares the piece on `from` can legally move to. */
  legalMovesFrom(from: Square): Square[] {
    const moves = this.chess.moves({ square: from as ChessSquare, verbose: true });
    // A promotion appears four times (one per piece), so remove duplicates.
    return [...new Set(moves.map((m) => m.to))];
  }

  /** True if moving from -> to is a pawn promotion (the player must choose a piece). */
  isPromotionMove(from: Square, to: Square): boolean {
    return this.chess
      .moves({ square: from as ChessSquare, verbose: true })
      .some((m) => m.to === to && m.promotion !== undefined);
  }

  pieceAt(square: Square): Piece | null {
    const p = this.chess.get(square as ChessSquare);
    return p ? { color: p.color, type: p.type } : null;
  }

  fen(): string {
    return this.chess.fen();
  }

  turn(): Color {
    return this.chess.turn();
  }

  status(): GameStatus {
    return getStatus(this.chess);
  }

  history(): MoveRecord[] {
    return [...this.records];
  }

  lastMove(): MoveRecord | null {
    return this.records.length > 0 ? this.records[this.records.length - 1] : null;
  }
}