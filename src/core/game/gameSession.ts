import { ChessGame } from './chessGame';
import type {
  Color,
  GameStatus,
  MoveInput,
  MoveRecord,
  MoveResult,
  Piece,
  Square,
} from './types';

/** One game as seen from one phone. */
export class GameSession {
  private game = new ChessGame();

  constructor(readonly localColor: Color) {}

  get opponentColor(): Color {
    return this.localColor === 'w' ? 'b' : 'w';
  }

  /** Move made by the person holding this phone. */
  moveLocal(input: MoveInput): MoveResult {
    if (this.game.status().kind !== 'playing') {
      return { ok: false, error: 'The game is over' };
    }
    if (this.game.turn() !== this.localColor) {
      return { ok: false, error: "It is not your turn" };
    }
    return this.game.move(input);
  }

  /** Move received from the other phone. It is fully validated. */
  applyRemote(input: MoveInput): MoveResult {
    if (this.game.status().kind !== 'playing') {
      return { ok: false, error: 'The game is over' };
    }
    if (this.game.turn() !== this.opponentColor) {
      return { ok: false, error: 'Opponent moved out of turn' };
    }
    return this.game.move(input);
  }

  legalMovesFrom(from: Square): Square[] {
    return this.game.legalMovesFrom(from);
  }

  isPromotionMove(from: Square, to: Square): boolean {
    return this.game.isPromotionMove(from, to);
  }

  pieceAt(square: Square): Piece | null {
    return this.game.pieceAt(square);
  }

  fen(): string {
    return this.game.fen();
  }

  turn(): Color {
    return this.game.turn();
  }

  isMyTurn(): boolean {
    return this.game.turn() === this.localColor;
  }

  status(): GameStatus {
    return this.game.status();
  }

  history(): MoveRecord[] {
    return this.game.history();
  }

  lastMove(): MoveRecord | null {
    return this.game.lastMove();
  }
}