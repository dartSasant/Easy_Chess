import { Text } from 'react-native';

import { PIECE_STYLES, type PieceStyleId } from '@/ui/theme/pieceStyles';

export type BoardPiece = {
  color: 'w' | 'b';
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
};

// Placeholder art: Unicode glyphs. The trailing \uFE0E stops iOS from
// drawing the pawn as an emoji. Replace this file with SVG pieces later;
// Board only depends on the props below.
const GLYPHS: Record<BoardPiece['type'], string> = {
  k: '\u265A\uFE0E',
  q: '\u265B\uFE0E',
  r: '\u265C\uFE0E',
  b: '\u265D\uFE0E',
  n: '\u265E\uFE0E',
  p: '\u265F\uFE0E',
};

type Props = {
  piece: BoardPiece;
  size: number;
  styleId: PieceStyleId;
};

export function PieceView({ piece, size, styleId }: Props) {
  const side = PIECE_STYLES[styleId][piece.color === 'w' ? 'white' : 'black'];

  return (
    <Text
      allowFontScaling={false}
      style={{
        fontSize: size * 0.78,
        lineHeight: size,
        height: size,
        width: size,
        textAlign: 'center',
        color: side.fill,
        textShadowColor: side.stroke,
        textShadowRadius: 1.5,
        textShadowOffset: { width: 0, height: 0 },
      }}
    >
      {GLYPHS[piece.type]}
    </Text>
  );
}