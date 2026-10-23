import type { ScanResult } from "expo-ble-kit";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { feedback } from "@/core/feedback";
import type { Color } from "@/core/game";
import {
  blockPlayer,
  loadBlocked,
  unblockPlayer,
  type BlockedPlayer,
} from "@/core/storage/blocked";
import { BleTransport } from "@/core/transport";
import { PullString } from "@/ui/common/pullString";
import { GamePopup } from "@/ui/game/gamePopups";
import { GameScreen } from "@/ui/game/gameScreen";
import { BounceButton } from "@/ui/home/bounceButton";
import { BlockedPlayers } from "@/ui/lobby/blockedPlayers";
import { Radar } from "@/ui/lobby/radar";

/** A second challenge from the same player within this time is ignored. */
const COOLDOWN_MS = 15000;

type Props = {
  playerName: string;
  /** Back to the home screen. Leaving this screen also stops Bluetooth. */
  onExit: () => void;
};

type Game = { localColor: Color; opponentName: string; round: number };
type Challenge = { peerId: string; name: string };

export function LobbyScreen({ playerName, onExit }: Props) {
  "use no memo";
  const [transport] = useState(() => new BleTransport(playerName));
  const [found, setFound] = useState<ScanResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [waitingId, setWaitingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedPlayer[]>(() => loadBlocked());
  const [showBlocked, setShowBlocked] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const seen = useRef(new Set<string>());
  const lastChallenge = useRef(new Map<string, number>());

  useEffect(() => {
    const off = transport.onEvent((e) => {
      if (e.kind === "log") {
        setLogs((old) =>
          [`${new Date().toLocaleTimeString()}  ${e.text}`, ...old].slice(
            0,
            40,
          ),
        );
      } else if (e.kind === "found") {
        // Soft ping when a phone we have not seen before appears.
        const fresh = e.devices.some((d) => !seen.current.has(d.id));
        e.devices.forEach((d) => seen.current.add(d.id));
        if (fresh) feedback.playerFound();
        setFound(e.devices);
      } else if (e.kind === "challenge") {
        const now = Date.now();
        const previous = lastChallenge.current.get(e.peerId);
        lastChallenge.current.set(e.peerId, now);
        const isBlocked = blocked.some((b) => b.id === e.peerId);
        const tooSoon = previous !== undefined && now - previous < COOLDOWN_MS;
        if (isBlocked || tooSoon) {
          transport.decline();
          return;
        }
        feedback.challenge(); // loud sound + strong vibration
        setChallenge({ peerId: e.peerId, name: e.name });
      } else if (e.kind === "challengeExpired") {
        setChallenge(null);
      } else if (e.kind === "noAnswer") {
        setWaitingId(null);
        setMessage("No answer. They may have declined.");
      } else if (e.kind === "ready") {
        feedback.challengeAccepted();
        setChallenge(null);
        setWaitingId(null);
        setGame({
          localColor: e.localColor,
          opponentName: e.opponentName,
          round: 1,
        });
      }
    });
    return () => {
      off();
    };
  }, [transport, blocked]);

  useEffect(() => {
    return () => {
      void transport.stop();
    };
  }, [transport]);

  if (game) {
    return (
      <GameScreen
        key={game.round}
        localColor={game.localColor}
        transport={transport}
        opponentName={game.opponentName}
        onRematch={() =>
          setGame(
            (g) =>
              g && {
                ...g,
                localColor: g.localColor === "w" ? "b" : "w",
                round: g.round + 1,
              },
          )
        }
        onLeave={onExit}
      />
    );
  }

  const start = async () => {
    feedback.tap();
    setStarted(true);
    try {
      await transport.start();
    } catch {
      setStarted(false);
    }
  };

  const challengePlayer = (id: string) => {
    if (waitingId) return;
    feedback.tap();
    setMessage(null);
    setWaitingId(id);
    void transport.connect(id).then((ok) => {
      if (!ok) {
        setWaitingId(null);
        setMessage("Could not connect. Try again.");
      }
    });
  };

  const accept = () => {
    feedback.tap();
    transport.accept();
    setChallenge(null);
  };

  const decline = () => {
    feedback.tap();
    transport.decline();
    setChallenge(null);
  };

  const block = () => {
    if (!challenge) return;
    feedback.tap();
    transport.decline();
    setBlocked(blockPlayer({ id: challenge.peerId, name: challenge.name }));
    setChallenge(null);
  };

  const status = waitingId
    ? "Challenge sent. Waiting for an answer..."
    : (message ?? `Nearby phones: ${found.length}`);

  return (
    <SafeAreaView className="flex-1 bg-canvas px-5">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8 pt-14"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-extrabold text-ink">
          Find an opponent
        </Text>
        <Text className="mt-2 text-base leading-6 text-ink/70">
          Press Start on both phones. Nearby phones show up on the radar. Tap a
          dot to challenge it.
        </Text>

        <View className="mt-6">
          <Radar
            devices={found}
            waitingId={waitingId}
            active={started}
            onSelect={challengePlayer}
          />
        </View>

        {!started ? (
          <View className="mt-6 items-center">
            <BounceButton
              onPress={start}
              className="rounded-full bg-accent px-12 py-4"
            >
              <Text className="text-xl font-extrabold text-ink">Start</Text>
            </BounceButton>
          </View>
        ) : (
          <View className="mt-5 flex-row items-center self-center rounded-full bg-bar px-4 py-2">
            <View className="mr-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <Text className="text-sm font-semibold text-ink">{status}</Text>
          </View>
        )}

        <View className="mt-8 flex-row justify-center">
          <Pressable
            onPress={() => {
              feedback.tap();
              setShowBlocked(true);
            }}
            className="mr-3 rounded-full border border-ink/10 bg-bar px-4 py-2"
          >
            <Text className="text-sm font-semibold text-ink">
              Blocked players ({blocked.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              feedback.tap();
              setShowLog((v) => !v);
            }}
            className="rounded-full border border-ink/10 bg-bar px-4 py-2"
          >
            <Text className="text-sm font-semibold text-ink">
              {showLog ? "Hide log" : "Show log"}
            </Text>
          </Pressable>
        </View>

        {showLog && logs.length > 0 && (
          <View className="mt-4 rounded-2xl bg-bar p-3">
            {logs.map((line, i) => (
              <Text key={i} className="text-xs text-ink/80">
                {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <PullString onPull={onExit} />

      {/* The challenge sound and vibration already played, so the popup stays quiet. */}
      <GamePopup
        visible={challenge !== null}
        sound={false}
        title={`${challenge?.name ?? "Someone"} wants to play`}
        message="Accept the challenge?"
        actions={[
          { label: "Block", tone: "danger", onPress: block },
          { label: "Decline", tone: "neutral", onPress: decline },
          { label: "Accept", tone: "primary", onPress: accept },
        ]}
      />

      <BlockedPlayers
        visible={showBlocked}
        players={blocked}
        onUnblock={(id) => setBlocked(unblockPlayer(id))}
        onClose={() => setShowBlocked(false)}
      />
    </SafeAreaView>
  );
}
