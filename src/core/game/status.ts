import type { Chess } from 'chess.js';

import type { GameStatus } from './types';

export function getStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    // The side to move is the one that got mated.
    return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { kind: 'draw', reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) {
    return { kind: 'draw', reason: 'insufficient-material' };
  }
  if (chess.isThreefoldRepetition()) {
    return { kind: 'draw', reason: 'threefold-repetition' };
  }
  if (chess.isDrawByFiftyMoves()) {
    return { kind: 'draw', reason: 'fifty-move-rule' };
  }
  return { kind: 'playing', check: chess.isCheck() };
}