import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Bot } from "@/core/bots";
import {
  GameSession,
  type Color,
  type MoveInput,
  type PieceType,
  type PromotionPiece,
  type Square,
} from "@/core/game";
import type { BleTransport } from "@/core/transport";
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

type Result = "win" | "loss" | "draw";

type Props = {
  localColor?: Color;
  /** Test mode: one phone plays both sides. Turn off for real games. */
  testMode?: boolean;
  /** Bluetooth link to the opponent. Without it, the screen has no network. */
  transport?: BleTransport;
  opponentName?: string;
  /** Bluetooth: both players agreed to a rematch. Bot: "Play again". The parent starts a new game. */
  onRematch?: () => void;
  /** Go back to the previous screen. */
  onLeave?: () => void;
  /** Play against this bot instead of a person. */
  bot?: Bot;
  /** Called once when a game against a bot ends. */
  onResult?: (result: Result) => void;
  /** Offered after a win against a bot. */
  onNextBot?: () => void;
};

export function GameScreen({
  localColor = "w",
  testMode = false,
  transport,
  opponentName = "Opponent",
  onRematch,
  onLeave,
  bot,
  onResult,
  onNextBot,
}: Props) {
  "use no memo";
  const [session] = useState(() => new GameSession(localColor));
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [ended, setEnded] = useState<string | null>(null);
  const [endedResult, setEndedResult] = useState<Result | null>(null);
  const [drawState, setDrawState] = useState<"none" | "sent" | "received">(
    "none",
  );
  const [rematch, setRematch] = useState<"none" | "sent" | "received">("none");
  const [linkClosed, setLinkClosed] = useState(false);
  const reported = useRef(false);

   const online = !!transport && !testMode;
  const vsBot = !!bot && !testMode;
  const opponentColor: Color = localColor === "w" ? "b" : "w";
  const oppLabel = bot ? `${bot.name} · Level ${bot.level}` : opponentName;
  const status = session.status();
  const isOver = status.kind !== "playing" || ended !== null;
  const thinking = vsBot && !isOver && !session.isMyTurn();
  const last = session.lastMove();

  const outcome: Result | null =
    status.kind === "checkmate"
      ? status.winner === localColor
        ? "win"
        : "loss"
      : status.kind === "draw"
        ? "draw"
        : endedResult;

  /** Ends the game by resignation, agreement or disconnect. The first ending wins. */
  const finish = (text: string, result: Result | null) => {
    setEnded((prev) => prev ?? text);
    setEndedResult((prev) => prev ?? result);
  };

  // Tell the campaign once when a bot game is over.
  useEffect(() => {
    if (!vsBot || !onResult || !outcome || reported.current) return;
    reported.current = true;
    onResult(outcome);
  }, [vsBot, onResult, outcome]);

  // The bot moves whenever it is its turn.
  // The bot moves whenever it is its turn.
  useEffect(() => {
    if (!bot || testMode || ended !== null) return;
    if (session.status().kind !== "playing" || session.isMyTurn()) return;

    let cancelled = false;
    bot
      .chooseMove(session.fen())
      .then((move) => {
        if (cancelled || !move) return;
        const result = session.applyRemote(move);
        if (result.ok) setTick((t) => t + 1);
        else Alert.alert("Bot error", result.error);
      })
      .catch(() => {
        // The bot failed. Nothing to apply, so the player simply keeps waiting.
      });

    return () => {
      cancelled = true;
    };
  }, [bot, testMode, ended, tick, session]);

  // Bluetooth messages and link events.
  useEffect(() => {
    if (!transport || testMode) return;

    const offMessage = transport.onMessage((msg) => {
      switch (msg.t) {
        case "move": {
          const result = session.applyRemote({
            from: msg.from,
            to: msg.to,
            promotion: msg.promotion,
          });
          if (result.ok) {
            setDrawState("none");
            setTick((t) => t + 1);
          } else {
            Alert.alert("Opponent sent a bad move", result.error);
          }
          break;
        }
        case "resign":
          finish(`${opponentName} resigned. You win`, "win");
          break;
        case "drawOffer":
          setDrawState("received");
          break;
        case "drawAccept":
          setDrawState("none");
          finish("Draw agreed", "draw");
          break;
        case "drawDecline":
          setDrawState("none");
          Alert.alert("Draw declined", `${opponentName} declined your offer.`);
          break;
        case "rematchOffer":
          // If we offered at the same moment, show their offer so one of us can accept it.
          setRematch("received");
          break;
        case "rematchAccept":
          // Ignored when we have no open offer, e.g. both accepted at once and we already restarted.
          if (rematch !== "none") onRematch?.();
          break;
        case "rematchDecline":
          setRematch("none");
          Alert.alert(
            "Rematch declined",
            `${opponentName} does not want a rematch.`,
          );
          break;
        case "leave":
          setLinkClosed(true);
          setRematch("none");
          if (session.status().kind === "playing") {
            finish(`${opponentName} left the game`, null);
          }
          break;
      }
    });

    const offEvent = transport.onEvent((e) => {
      if (e.kind === "closed") {
        setLinkClosed(true);
        setRematch("none");
        if (session.status().kind === "playing") finish(e.reason, null);
      }
    });

    return () => {
      offMessage();
      offEvent();
    };
  }, [transport, testMode, session, opponentName, rematch, onRematch]);

  const select = (square: Square | null) => {
    setSelected(square);
    setTargets(square ? session.legalMovesFrom(square) : []);
  };

  const play = async (input: MoveInput) => {
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

    if (online && transport) {
      setDrawState("none");
      const sent = await transport.send({
        t: "move",
        from: input.from,
        to: input.to,
        promotion: input.promotion,
        ply: result.move.ply,
      });
      if (!sent)
        Alert.alert("Move not sent", "The opponent may have disconnected.");
    }
  };

  const onSquarePress = (square: Square) => {
    if (isOver) return;
    if (!testMode && !session.isMyTurn()) return;

    if (selected && targets.includes(square)) {
      if (session.isPromotionMove(selected, square)) {
        setPending({ from: selected, to: square });
      } else {
        void play({ from: selected, to: square });
      }
      return;
    }

    const piece = session.pieceAt(square);
    select(piece && piece.color === session.turn() ? square : null);
  };

  const comingSoon = (what: string) =>
    Alert.alert(what, "This needs the Bluetooth connection or a bot.");

  const resign = () => {
    if (!vsBot && !(online && transport)) return comingSoon("Resign");
    Alert.alert("Resign?", "You will lose this game.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resign",
        style: "destructive",
        onPress: () => {
          if (online && transport) void transport.send({ t: "resign" });
          finish("You resigned", "loss");
        },
      },
    ]);
  };

  const offerDraw = () => {
    if (vsBot && bot) {
      if (bot.acceptsDraw(session.fen(), opponentColor)) {
        finish("Draw agreed", "draw");
      } else {
        Alert.alert("Draw declined", `${bot.name} wants to play on.`);
      }
      return;
    }
    if (!online || !transport) return comingSoon("Offer draw");
    void transport.send({ t: "drawOffer" });
    setDrawState("sent");
  };

  const answerDraw = (accept: boolean) => {
    if (!transport) return;
    void transport.send({ t: accept ? "drawAccept" : "drawDecline" });
    setDrawState("none");
    if (accept) finish("Draw agreed", "draw");
  };

  const offerRematch = () => {
    if (!transport) return;
    void transport.send({ t: "rematchOffer" });
    setRematch("sent");
  };

  const answerRematch = (accept: boolean) => {
    if (!transport) return;
    void transport.send({ t: accept ? "rematchAccept" : "rematchDecline" });
    if (accept) onRematch?.();
    else setRematch("none");
  };

  const leave = async () => {
    if (online && transport && !linkClosed) {
      await transport.send({ t: "leave" }); // tell the other phone before Bluetooth stops
    }
    onLeave?.();
  };

  const headline =
    ended ?? (thinking ? `${oppLabel} is thinking...` : statusText(session));

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-center">
        <PlayerBar
          name={oppLabel}
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
          {headline}
        </Text>

        {drawState === "received" && !isOver && (
          <View className="mt-2 flex-row items-center justify-center">
            <Text className="mr-3 text-ink">{opponentName} offers a draw</Text>
            <Pressable
              onPress={() => answerDraw(true)}
              className="mr-2 rounded-lg bg-accent px-3 py-2"
            >
              <Text className="font-bold text-ink">Accept</Text>
            </Pressable>
            <Pressable
              onPress={() => answerDraw(false)}
              className="rounded-lg border border-danger px-3 py-2"
            >
              <Text className="font-bold text-danger">Decline</Text>
            </Pressable>
          </View>
        )}

        {isOver && (
          <View className="mt-2 items-center">
            {online && rematch === "received" && (
              <View className="flex-row items-center justify-center">
                <Text className="mr-3 text-ink">
                  {opponentName} wants a rematch
                </Text>
                <Pressable
                  onPress={() => answerRematch(true)}
                  className="mr-2 rounded-lg bg-accent px-3 py-2"
                >
                  <Text className="font-bold text-ink">Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => answerRematch(false)}
                  className="rounded-lg border border-danger px-3 py-2"
                >
                  <Text className="font-bold text-danger">Decline</Text>
                </Pressable>
              </View>
            )}

            {online && linkClosed && (
              <Text className="text-ink">Rematch is not available.</Text>
            )}

            <View className="mt-2 flex-row">
              {vsBot && outcome === "win" && onNextBot && (
                <Pressable
                  onPress={onNextBot}
                  className="mr-2 rounded-lg bg-accent px-4 py-3"
                >
                  <Text className="font-bold text-ink">Next bot</Text>
                </Pressable>
              )}
              {vsBot && onRematch && (
                <Pressable
                  onPress={onRematch}
                  className="mr-2 rounded-lg bg-accent px-4 py-3"
                >
                  <Text className="font-bold text-ink">Play again</Text>
                </Pressable>
              )}
              {online && !linkClosed && rematch !== "received" && (
                <Pressable
                  onPress={offerRematch}
                  disabled={rematch === "sent"}
                  className="mr-2 rounded-lg bg-accent px-4 py-3"
                >
                  <Text className="font-bold text-ink">
                    {rematch === "sent" ? "Waiting..." : "Rematch"}
                  </Text>
                </Pressable>
              )}
              {onLeave && (
                <Pressable
                  onPress={() => void leave()}
                  className="rounded-lg bg-bar px-4 py-3"
                >
                  <Text className="font-bold text-ink">
                    {vsBot ? "Back to bots" : "Back to home"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <PlayerBar
          name="You"
          captured={capturedBy(session, localColor)}
          capturedColor={opponentColor}
        >
          <View className="flex-row">
            <Pressable
              onPress={resign}
              disabled={isOver}
              className="mr-2 rounded-lg border border-danger px-3 py-2"
            >
              <Text className="font-bold text-danger">Resign</Text>
            </Pressable>
            <Pressable
              onPress={offerDraw}
              disabled={isOver || drawState === "sent"}
              className="rounded-lg bg-accent px-3 py-2"
            >
              <Text className="font-bold text-ink">
                {drawState === "sent" ? "Offered" : "Offer draw"}
              </Text>
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
                onPress={() =>
                  pending && void play({ ...pending, promotion: type })
                }
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
