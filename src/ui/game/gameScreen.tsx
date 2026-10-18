import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  GameSession,
  type Color,
  type MoveInput,
  type PieceType,
  type PromotionPiece,
  type Square,
} from "@/core/game";
import { Board } from "@/ui/board/board";
import { PieceView } from "@/ui/board/pieceView";
import { DEFAULT_PIECE_STYLE } from "@/ui/theme/pieceStyles";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const START_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const CAPTURE_ORDER = ["q", "r", "b", "n", "p"] as const;
const PROMOTION_CHOICES: PromotionPiece[] = ["q", "r", "b", "n"];

const DRAW_TEXT = {
  stalemate: "stalemate",
  "insufficient-material": "insufficient material",
  "threefold-repetition": "threefold repetition",
  "fifty-move-rule": "the fifty-move rule",
} as const;

/** Pieces of the opposite color that are missing from the board. */
function capturedBy(session: GameSession, capturer: Color): PieceType[] {
  const victim: Color = capturer === "w" ? "b" : "w";
  const onBoard = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (const f of FILES) {
    for (const r of RANKS) {
      const piece = session.pieceAt(`${f}${r}`);
      if (piece && piece.color === victim && piece.type !== "k") {
        onBoard[piece.type] += 1;
      }
    }
  }

  const result: PieceType[] = [];
  for (const type of CAPTURE_ORDER) {
    const missing = Math.max(0, START_COUNTS[type] - onBoard[type]);
    for (let i = 0; i < missing; i++) result.push(type);
  }
  return result;
}

function statusText(session: GameSession): string {
  const status = session.status();
  if (status.kind === "checkmate") {
    return `Checkmate. ${status.winner === "w" ? "White" : "Black"} wins`;
  }
  if (status.kind === "draw") {
    return `Draw by ${DRAW_TEXT[status.reason]}`;
  }
  const side = session.turn() === "w" ? "White" : "Black";
  return status.check ? `${side} to move, check` : `${side} to move`;
}

type PlayerBarProps = {
  name: string;
  captured: PieceType[];
  capturedColor: Color;
  children?: React.ReactNode;
};

function PlayerBar({
  name,
  captured,
  capturedColor,
  children,
}: PlayerBarProps) {
  return (
    <View className="mx-3 my-2 flex-row items-center justify-between rounded-xl bg-bar px-3 py-2">
      <View className="flex-1">
        <Text className="text-base font-bold text-ink">{name}</Text>
        <View className="h-5 flex-row">
          {captured.map((type, i) => (
            <View key={i} style={{ marginRight: -6 }}>
              <PieceView
                piece={{ color: capturedColor, type }}
                size={20}
                styleId={DEFAULT_PIECE_STYLE}
              />
            </View>
          ))}
        </View>
      </View>
      {children}
    </View>
  );
}

type Props = {
  localColor?: Color;
  /** Test mode: one phone plays both sides. Turn off for real games. */
  testMode?: boolean;
};

export function GameScreen({ localColor = "w", testMode = false }: Props) {
  "use no memo";
  const [session] = useState(() => new GameSession(localColor));
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(
    null,
  );

  const opponentColor: Color = localColor === "w" ? "b" : "w";
  const isOver = session.status().kind !== "playing";
  const last = session.lastMove();

  const select = (square: Square | null) => {
    setSelected(square);
    setTargets(square ? session.legalMovesFrom(square) : []);
  };

  const play = (input: MoveInput) => {
    const result = session.isMyTurn()
      ? session.moveLocal(input)
      : session.applyRemote(input);

    setPending(null);
    select(null);
    if (!result.ok) {
      Alert.alert("Move not allowed", result.error);
      return;
    }
    setTick((t) => t + 1);
    setTick((t) => t + 1);
  };

  const onSquarePress = (square: Square) => {
    if (isOver) return;
    if (!testMode && !session.isMyTurn()) return;

    if (selected && targets.includes(square)) {
      if (session.isPromotionMove(selected, square)) {
        setPending({ from: selected, to: square });
      } else {
        play({ from: selected, to: square });
      }
      return;
    }

    const piece = session.pieceAt(square);
    select(piece && piece.color === session.turn() ? square : null);
  };

  const comingSoon = (what: string) =>
    Alert.alert(
      what,
      "This needs the Bluetooth connection, so it comes later.",
    );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-center">
        <PlayerBar
          name="Opponent"
          captured={capturedBy(session, opponentColor)}
          capturedColor={localColor}
        />

        <View className="items-center">
          <Board
            pieceAt={(sq) => session.pieceAt(sq)}
            orientation={localColor}
            selected={selected}
            legalTargets={targets}
            lastMove={last ? { from: last.from, to: last.to } : null}
            onSquarePress={onSquarePress}
            disabled={isOver}
          />
        </View>

        <Text className="mt-3 text-center text-base font-bold text-ink">
          {statusText(session)}
        </Text>

        <PlayerBar
          name="You"
          captured={capturedBy(session, localColor)}
          capturedColor={opponentColor}
        >
          <View className="flex-row">
            <Pressable
              onPress={() => comingSoon("Resign")}
              className="mr-2 rounded-lg border border-danger px-3 py-2"
            >
              <Text className="font-bold text-danger">Resign</Text>
            </Pressable>
            <Pressable
              onPress={() => comingSoon("Offer draw")}
              className="rounded-lg bg-accent px-3 py-2"
            >
              <Text className="font-bold text-ink">Offer draw</Text>
            </Pressable>
          </View>
        </PlayerBar>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={pending !== null}
        onRequestClose={() => setPending(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-ink/60"
          onPress={() => setPending(null)}
        >
          <View className="flex-row rounded-2xl bg-bar p-3">
            {PROMOTION_CHOICES.map((type) => (
              <Pressable
                key={type}
                accessibilityLabel={`Promote to ${type}`}
                onPress={() => pending && play({ ...pending, promotion: type })}
                className="mx-1 rounded-xl bg-canvas"
              >
                <PieceView
                  piece={{ color: session.turn(), type }}
                  size={56}
                  styleId={DEFAULT_PIECE_STYLE}
                />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
