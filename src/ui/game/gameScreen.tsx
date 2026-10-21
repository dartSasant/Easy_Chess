import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Bot } from "@/core/bots";
import {
  enterGame,
  feedback,
  gameEndFeedback,
  haptics,
  leaveGame,
  moveFeedback,
} from "@/core/feedback";
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
import { BotBubble } from "@/ui/game/botBubble";
import { GamePopup } from "@/ui/game/gamePopups";
import { MoveList } from "@/ui/game/moveList";
import { PlayerCard } from "@/ui/game/playerCard";
import { useBotChatter } from "@/ui/game/useBotChatter";
import { useGameClock } from "@/ui/game/useGameClock";
import { Confetti, Trophy } from "@/ui/game/winCelebration";
import { pickMascotLine } from "@/ui/mascot/mascotLines";
import { requestMascotPeek, useMascotBlockedWhile } from "@/ui/mascot/mascotStore";
import { useTheme } from "@/ui/theme/useTheme";

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

/**
 * Sound + haptic for a move that was just applied.
 * The move text (SAN) tells us about captures ("x") and checks ("+").
 * If the game just ended, the game-end sound plays instead.
 */
function playMoveSound(session: GameSession, san: string, remote = false) {
  if (session.status().kind !== "playing") return;
  moveFeedback({ capture: san.includes("x"), check: san.includes("+"), remote });
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
  const theme = useTheme();
  const [session] = useState(() => new GameSession(localColor));
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(null);
  const [ended, setEnded] = useState<string | null>(null);
  const [endedResult, setEndedResult] = useState<Result | null>(null);
  const [drawState, setDrawState] = useState<"none" | "sent" | "received">("none");
  const [rematch, setRematch] = useState<"none" | "sent" | "received">("none");
  const [linkClosed, setLinkClosed] = useState(false);
  const [resignAsk, setResignAsk] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [disconnectMsg, setDisconnectMsg] = useState<string | null>(null);
  const reported = useRef(false);
  const endSoundPlayed = useRef(false);

  const online = !!transport && !testMode;
  const vsBot = !!bot && !testMode;
  const opponentColor: Color = localColor === "w" ? "b" : "w";
  const oppName = bot ? bot.name : opponentName;
  const oppLabel = bot ? `${bot.name} · Level ${bot.level}` : opponentName;
  const status = session.status();
  const isOver = status.kind !== "playing" || ended !== null;
  const thinking = vsBot && !isOver && !session.isMyTurn();
  const clock = useGameClock(session.turn(), !isOver);

  const outcome: Result | null =
    status.kind === "checkmate"
      ? status.winner === localColor
        ? "win"
        : "loss"
      : status.kind === "draw"
        ? "draw"
        : endedResult;

  // Bot speech bubbles and reactions (campaign games only).
  const chat = useBotChatter({
    level: bot?.level ?? 1,
    enabled: vsBot,
    moves: session.history(),
    localColor,
    outcome,
  });

  /** Ends the game by resignation, agreement or disconnect. The first ending wins. */
  const finish = (text: string, result: Result | null) => {
    setEnded((prev) => prev ?? text);
    setEndedResult((prev) => prev ?? result);
  };

  // Sound: silence the menu ambience while this screen is open, and play a
  // short "new game" sound when it opens.
  useEffect(() => {
    enterGame();
    feedback.newGame();
    return () => leaveGame();
  }, []);

  // Sound: play the win / lose / draw sound once when the game ends.
  useEffect(() => {
    if (!outcome || endSoundPlayed.current) return;
    endSoundPlayed.current = true;
    gameEndFeedback(outcome === "loss" ? "lose" : outcome);
  }, [outcome]);

  // The mascot stays away while a game is in progress, then peeks in with a line when it ends.
  useMascotBlockedWhile(!isOver);
  const mascotSpoke = useRef(false);
  useEffect(() => {
    if (!outcome || mascotSpoke.current) return;
    mascotSpoke.current = true;
    requestMascotPeek({ line: pickMascotLine(outcome), delayMs: 1200 });
  }, [outcome]);

  // Tell the campaign once when a bot game is over.
  useEffect(() => {
    if (!vsBot || !onResult || !outcome || reported.current) return;
    reported.current = true;
    onResult(outcome);
  }, [vsBot, onResult, outcome]);

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
        if (result.ok) {
          playMoveSound(session, result.move.san, true);
          setTick((t) => t + 1);
        } else Alert.alert("Bot error", result.error);
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
            playMoveSound(session, result.move.san, true);
            setDrawState("none");
            setTick((t) => t + 1);
          } else {
            feedback.error();
            Alert.alert("Opponent sent a bad move", result.error);
          }
          break;
        }
        case "resign":
          finish(`${opponentName} resigned. You win`, "win");
          break;
        case "drawOffer":
          feedback.drawOffer();
          setDrawState("received");
          break;
        case "drawAccept":
          setDrawState("none");
          finish("Draw agreed", "draw");
          break;
        case "drawDecline":
          setDrawState("none");
          setNotice({ title: "Draw declined", message: `${opponentName} declined your offer.` });
          break;
        case "rematchOffer":
          // If we offered at the same moment, show their offer so one of us can accept it.
          feedback.popup();
          setRematch("received");
          break;
        case "rematchAccept":
          // Ignored when we have no open offer, e.g. both accepted at once and we already restarted.
          if (rematch !== "none") onRematch?.();
          break;
        case "rematchDecline":
          feedback.popup();
          setRematch("none");
          Alert.alert("Rematch declined", `${opponentName} does not want a rematch.`);
          break;
        case "leave":
          setLinkClosed(true);
          setRematch("none");
          if (session.status().kind === "playing") {
            setDisconnectMsg(`${opponentName} left the game.`);
            finish(`${opponentName} left the game`, null);
          }
          break;
      }
    });

    const offEvent = transport.onEvent((e) => {
      if (e.kind === "closed") {
        setLinkClosed(true);
        setRematch("none");
        if (session.status().kind === "playing") {
          setDisconnectMsg(`Connection lost: ${e.reason}`);
          finish(e.reason, null);
        }
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
    const result = session.isMyTurn() ? session.moveLocal(input) : session.applyRemote(input);

    setPending(null);
    select(null);
    if (!result.ok) {
      feedback.error();
      Alert.alert("Move not allowed", result.error);
      return;
    }
    playMoveSound(session, result.move.san);
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
      if (!sent) Alert.alert("Move not sent", "The opponent may have disconnected.");
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
    const mine = !!piece && piece.color === session.turn();
    if (mine) haptics.tap(); // light tick when you pick up a piece
    select(mine ? square : null);
  };

  const comingSoon = (what: string) =>
    Alert.alert(what, "This needs the Bluetooth connection or a bot.");

  const resign = () => {
    feedback.tap();
    if (!vsBot && !(online && transport)) return comingSoon("Resign");
    setResignAsk(true);
  };

  const confirmResign = () => {
    setResignAsk(false);
    if (online && transport) void transport.send({ t: "resign" });
    finish("You resigned", "loss");
  };

  const offerDraw = () => {
    feedback.tap();
    if (vsBot && bot) {
      if (bot.acceptsDraw(session.fen(), opponentColor)) {
        finish("Draw agreed", "draw");
      } else {
        setNotice({ title: "Draw declined", message: `${bot.name} wants to play on.` });
      }
      return;
    }
    if (!online || !transport) return comingSoon("Offer draw");
    void transport.send({ t: "drawOffer" });
    setDrawState("sent");
  };

  const answerDraw = (accept: boolean) => {
    if (!transport) return;
    feedback.tap();
    void transport.send({ t: accept ? "drawAccept" : "drawDecline" });
    setDrawState("none");
    if (accept) finish("Draw agreed", "draw");
  };

  const offerRematch = () => {
    if (!transport) return;
    feedback.tap();
    void transport.send({ t: "rematchOffer" });
    setRematch("sent");
  };

  const answerRematch = (accept: boolean) => {
    if (!transport) return;
    feedback.tap();
    void transport.send({ t: accept ? "rematchAccept" : "rematchDecline" });
    if (accept) onRematch?.();
    else setRematch("none");
  };

  const leave = async () => {
    feedback.nav();
    if (online && transport && !linkClosed) {
      await transport.send({ t: "leave" }); // tell the other phone before Bluetooth stops
    }
    onLeave?.();
  };

  const headline = ended ?? (thinking ? `${oppLabel} is thinking...` : statusText(session));

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-center">
        <PlayerCard
          name={oppName}
          subtitle={bot ? `Level ${bot.level}` : undefined}
          captured={capturedBy(session, opponentColor)}
          capturedColor={localColor}
          seconds={clock[opponentColor]}
          active={!isOver && session.turn() === opponentColor}
        />

        {/* Fixed-height slot, so the layout does not jump when the bubble appears. */}
        {vsBot && bot ? (
          <View style={{ height: 48, justifyContent: "center" }}>
            {chat ? <BotBubble level={bot.level} chat={chat} /> : null}
          </View>
        ) : null}

        <View className="items-center">
          <Board
            pieceAt={(sq) => session.pieceAt(sq)}
            orientation={localColor}
            selected={selected}
            legalTargets={targets}
            showCoordinates
            onSquarePress={onSquarePress}
            disabled={isOver}
          />
        </View>

        <View className="mt-2">
          <MoveList moves={session.history()} />
        </View>

        <Text className="mt-2 text-center text-base font-bold text-ink">{headline}</Text>

        {isOver && (
          <View className="mt-2 items-center">
            {vsBot && outcome === "win" ? <Trophy /> : null}

            {online && rematch === "received" && (
              <View className="flex-row items-center justify-center">
                <Text className="mr-3 text-ink">{opponentName} wants a rematch</Text>
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

            {online && linkClosed && <Text className="text-ink">Rematch is not available.</Text>}

            <View className="mt-2 flex-row">
              {vsBot && outcome === "win" && onNextBot && (
                <Pressable
                  onPress={() => {
                    feedback.nav();
                    onNextBot();
                  }}
                  className="mr-2 rounded-lg bg-accent px-4 py-3"
                >
                  <Text className="font-bold text-ink">Next opponent</Text>
                </Pressable>
              )}
              {vsBot && onRematch && (
                <Pressable
                  onPress={() => {
                    feedback.nav();
                    onRematch();
                  }}
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
                <Pressable onPress={() => void leave()} className="rounded-lg bg-bar px-4 py-3">
                  <Text className="font-bold text-ink">
                    {vsBot ? "Back to bots" : "Back to home"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <PlayerCard
          name="You"
          captured={capturedBy(session, localColor)}
          capturedColor={opponentColor}
          seconds={clock[localColor]}
          active={!isOver && session.turn() === localColor}
        >
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
        </PlayerCard>
      </View>

      {/* Promotion choice */}
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
                onPress={() => pending && void play({ ...pending, promotion: type })}
                className="mx-1 rounded-xl bg-canvas"
              >
                <PieceView
                  piece={{ color: session.turn(), type }}
                  size={56}
                  styleId={theme.pieceStyle}
                />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Resign confirmation */}
      <GamePopup
        visible={resignAsk}
        title="Are you sure?"
        message="You will lose this game."
        onClose={() => setResignAsk(false)}
        actions={[
          { label: "Cancel", tone: "neutral", onPress: () => setResignAsk(false) },
          { label: "Resign", tone: "danger", onPress: confirmResign },
        ]}
      />

      {/* Draw offered to you */}
      <GamePopup
        visible={drawState === "received" && !isOver}
        title="Draw offered"
        message={`${opponentName} offers a draw.`}
        sound={false}
        actions={[
          { label: "Decline", tone: "danger", onPress: () => answerDraw(false) },
          { label: "Accept", tone: "primary", onPress: () => answerDraw(true) },
        ]}
      />

      {/* Draw declined and other short notices */}
      <GamePopup
        visible={notice !== null}
        title={notice?.title ?? ""}
        message={notice?.message}
        onClose={() => setNotice(null)}
        actions={[{ label: "OK", tone: "primary", onPress: () => setNotice(null) }]}
      />

      {/* Opponent left or the link dropped */}
      <GamePopup
        visible={disconnectMsg !== null}
        title="Opponent disconnected"
        message={disconnectMsg ?? ""}
        actions={[
          { label: "Stay", tone: "neutral", onPress: () => setDisconnectMsg(null) },
          ...(onLeave
            ? [{ label: "Leave", tone: "primary" as const, onPress: () => void leave() }]
            : []),
        ]}
      />

      {/* Confetti falls over everything after a win against a bot */}
      {vsBot && outcome === "win" ? <Confetti /> : null}
    </SafeAreaView>
  );
}