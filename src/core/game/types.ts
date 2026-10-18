export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

/** Square name like 'e4'. */
export type Square = string;

export type Piece = {
  color: Color;
  type: PieceType;
};

export type MoveInput = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
};

export type MoveRecord = {
  /** 1 for White's first move, 2 for Black's first move, and so on. */
  ply: number;
  color: Color;
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  san: string;
};

export type DrawReason =
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule';

export type GameStatus =
  | { kind: 'playing'; check: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason };

export type MoveResult =
  | { ok: true; move: MoveRecord }
  | { ok: false; error: string };