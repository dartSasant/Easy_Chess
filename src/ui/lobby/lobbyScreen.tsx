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
        setLogs((old) => [`${new Date().toLocaleTimeString()}  ${e.text}`, ...old].slice(0, 40));
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
        setGame({ localColor: e.localColor, opponentName: e.opponentName, round: 1 });
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
          setGame((g) =>
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

  return (
    <SafeAreaView className="flex-1 bg-canvas px-4">
      <Pressable
        onPress={() => {
          feedback.nav();
          onExit();
        }}
        className="mt-4 self-start rounded-lg bg-bar px-3 py-2"
      >
        <Text className="font-bold text-ink">Back</Text>
      </Pressable>

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <Text className="mt-4 text-xl font-bold text-ink">Find an opponent</Text>
        <Text className="mt-1 text-ink">
          Press Start on both phones. Nearby phones show up on the radar. Tap a dot to challenge
          it.
        </Text>

        {!started ? (
          <View className="mt-6 items-start">
            <BounceButton onPress={start} className="rounded-lg bg-accent px-6 py-3">
              <Text className="text-lg font-bold text-ink">Start</Text>
            </BounceButton>
          </View>
        ) : (
          <View className="mt-4">
            <Radar devices={found} waitingId={waitingId} onSelect={challengePlayer} />
            <Text className="mt-3 text-center text-ink">
              {waitingId
                ? "Challenge sent. Waiting for an answer..."
                : message ?? `Nearby phones: ${found.length}`}
            </Text>
          </View>
        )}

        <View className="mt-4 flex-row">
          <Pressable
            onPress={() => {
              feedback.tap();
              setShowBlocked(true);
            }}
            className="mr-2 rounded-lg bg-bar px-3 py-2"
          >
            <Text className="text-ink">Blocked players ({blocked.length})</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              feedback.tap();
              setShowLog((v) => !v);
            }}
            className="rounded-lg bg-bar px-3 py-2"
          >
            <Text className="text-ink">{showLog ? "Hide log" : "Show log"}</Text>
          </Pressable>
        </View>

        {showLog && (
          <View className="mt-3 rounded-lg bg-bar p-2">
            {logs.map((line, i) => (
              <Text key={i} className="text-xs text-ink">
                {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

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