import type { ScanResult } from "expo-ble-kit";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Color } from "@/core/game";
import { BleTransport } from "@/core/transport";
import { GameScreen } from "@/ui/game/gameScreen";

type Props = {
  playerName: string;
  /** Back to the home screen. Leaving this screen also stops Bluetooth. */
  onExit: () => void;
};

type Game = { localColor: Color; opponentName: string; round: number };

export function LobbyScreen({ playerName, onExit }: Props) {
  "use no memo";
  const [transport] = useState(() => new BleTransport(playerName));
  const [found, setFound] = useState<ScanResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const off = transport.onEvent((e) => {
      if (e.kind === "log") {
        setLogs((old) => [`${new Date().toLocaleTimeString()}  ${e.text}`, ...old].slice(0, 40));
      } else if (e.kind === "found") {
        setFound(e.devices);
      } else if (e.kind === "ready") {
        setGame({ localColor: e.localColor, opponentName: e.opponentName, round: 1 });
      }
    });
    return () => {
      off();
    };
  }, [transport]);

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
    setStarted(true);
    try {
      await transport.start();
    } catch {
      setStarted(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas px-4">
      <Pressable onPress={onExit} className="mt-4 self-start rounded-lg bg-bar px-3 py-2">
        <Text className="font-bold text-ink">Back</Text>
      </Pressable>

      <Text className="mt-4 text-xl font-bold text-ink">Find an opponent</Text>
      <Text className="mt-1 text-ink">
        Press Start on both phones, then tap the other phone in the list on one of them.
      </Text>

      <Pressable
        onPress={start}
        disabled={started}
        className={`mt-3 self-start rounded-lg px-4 py-3 ${started ? "bg-bar" : "bg-accent"}`}
      >
        <Text className="font-bold text-ink">{started ? "Searching..." : "Start"}</Text>
      </Pressable>

      <Text className="mt-4 font-bold text-ink">Nearby phones ({found.length})</Text>
      {found.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => transport.connect(r.id)}
          className="mt-2 rounded-lg bg-bar px-3 py-2"
        >
          <Text className="text-ink">
            {r.name ?? "unnamed"} · {r.id} · {r.rssi} dBm
          </Text>
          <Text className="text-ink">Tap to connect</Text>
        </Pressable>
      ))}

      <Text className="mt-4 font-bold text-ink">Log</Text>
      <ScrollView className="mt-1 flex-1 rounded-lg bg-bar p-2">
        {logs.map((line, i) => (
          <Text key={i} className="text-xs text-ink">
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}