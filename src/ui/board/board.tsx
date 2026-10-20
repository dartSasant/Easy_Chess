import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { type PieceStyleId } from "@/ui/theme/pieceStyles";
import { useTheme } from "@/ui/theme/useTheme";
import { PieceView, type BoardPiece } from "./pieceView";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

type Props = {
  /** Returns the piece on a square like 'e4', or null. */
  pieceAt: (square: string) => BoardPiece | null;
  /** Which side is at the bottom of the screen. */
  orientation: "w" | "b";
  selected: string | null;
  /** Squares the selected piece can move to. */
  legalTargets: readonly string[];
  /** Optional: from/to squares of the last move. */
  lastMove?: { from: string; to: string } | null;
  /** Optional: overrides the piece style of the current theme. */
  pieceStyle?: PieceStyleId;
  /** Draws a-h along the bottom and 1-8 along the left. */
  showCoordinates?: boolean;
  onSquarePress: (square: string) => void;
  disabled?: boolean;
};

export function Board({
  pieceAt,
  orientation,
  selected,
  legalTargets,
  lastMove = null,
  pieceStyle,
  showCoordinates = false,
  onSquarePress,
  disabled = false,
}: Props) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const style = pieceStyle ?? theme.pieceStyle;
  const squareSize = Math.floor(Math.min(width, 520) / 8);
  const boardSize = squareSize * 8;
  const labelSize = Math.max(9, Math.floor(squareSize * 0.22));

  const files = orientation === "w" ? FILES : [...FILES].reverse();
  const ranks = orientation === "w" ? [...RANKS].reverse() : RANKS;

  const targets = new Set(legalTargets);

  return (
    <View style={{ width: boardSize, height: boardSize }}>
      {ranks.map((rank, row) => (
        <View key={rank} style={{ flexDirection: "row" }}>
          {files.map((file, col) => {
            const square = `${file}${rank}`;
            const isDark = (row + col) % 2 === 1;
            const piece = pieceAt(square);
            const isSelected = selected === square;
            const isLast =
              lastMove != null && (lastMove.from === square || lastMove.to === square);

            return (
              <Pressable
                key={square}
                disabled={disabled}
                onPress={() => onSquarePress(square)}
                accessibilityLabel={square}
                className={isDark ? "bg-square-dark" : "bg-square-light"}
                style={{
                  width: squareSize,
                  height: squareSize,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(isSelected || isLast) && (
                  <View
                    pointerEvents="none"
                    className="bg-accent"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: isSelected ? 0.6 : 0.35,
                    }}
                  />
                )}
                {piece && <PieceView piece={piece} size={squareSize} styleId={style} />}
                {targets.has(square) && (
                  <View
                    pointerEvents="none"
                    className="bg-ink"
                    style={{
                      position: "absolute",
                      width: squareSize * 0.28,
                      height: squareSize * 0.28,
                      borderRadius: squareSize * 0.14,
                      opacity: 0.4,
                    }}
                  />
                )}
                {showCoordinates && col === 0 && (
                  <Text
                    pointerEvents="none"
                    className="text-ink"
                    style={{ position: "absolute", top: 1, left: 3, fontSize: labelSize, opacity: 0.65 }}
                  >
                    {rank}
                  </Text>
                )}
                {showCoordinates && row === 7 && (
                  <Text
                    pointerEvents="none"
                    className="text-ink"
                    style={{ position: "absolute", bottom: 1, right: 3, fontSize: labelSize, opacity: 0.65 }}
                  >
                    {file}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}