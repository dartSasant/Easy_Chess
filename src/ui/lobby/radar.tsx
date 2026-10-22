import type { ScanResult } from "expo-ble-kit";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useTheme } from "@/ui/theme/useTheme";

function hash(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h;
}

function Pulse({
  delay,
  size,
  color,
}: {
  delay: number;
  size: number;
  color: string;
}) {
  "use no memo";
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const run = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(t, {
          toValue: 1,
          duration: 2800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ]);
    run.start();
    return () => run.stop();
  }, [t, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: `${color}22`,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
        transform: [
          {
            scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }),
          },
        ],
      }}
    />
  );
}

function Glow({ color }: { color: string }) {
  "use no memo";
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
        transform: [
          {
            scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.7] }),
          },
        ],
      }}
    />
  );
}

type Props = {
  devices: ScanResult[];
  /** Id of the phone we challenged and are waiting for. */
  waitingId: string | null;
  /** Pulses only run while the lobby is searching. */
  active: boolean;
  onSelect: (id: string) => void;
};

// Soft discs, biggest first. Alpha is a hex pair added to the theme color.
const DISCS: { f: number; fill: string }[] = [
  { f: 1, fill: "14" },
  { f: 0.72, fill: "1C" },
  { f: 0.44, fill: "28" },
];

export function Radar({ devices, waitingId, active, onSelect }: Props) {
  "use no memo";
  const { width } = useWindowDimensions();
  const c = useTheme().colors;
  const size = Math.min(width - 40, 340);
  const radius = size / 2;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        {/* Soft discs and thin rings, no solid background */}
        {DISCS.map(({ f, fill }) => (
          <View
            key={f}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: radius - radius * f,
              top: radius - radius * f,
              width: size * f,
              height: size * f,
              borderRadius: (size * f) / 2,
              backgroundColor: `${c.accent}${fill}`,
              borderWidth: 1,
              borderColor: `${c.ink}1F`,
            }}
          />
        ))}

        {/* The sweeping pulses */}
        {active ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size,
              height: size,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pulse delay={0} size={size} color={c.accent} />
            <Pulse delay={1400} size={size} color={c.accent} />
          </View>
        ) : null}

        {/* You */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: radius - 15,
            top: radius - 15,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: `${c.accent}66`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: c.ink,
            }}
          />
        </View>

        {/* Nearby phones */}
        {devices.map((d, i) => {
          const angle = ((hash(d.id) % 360) * Math.PI) / 180;
          const strength = Math.min(1, Math.max(0, ((d.rssi ?? -80) + 100) / 60));
          const dist = 0.9 - strength * 0.65;
          const x = radius + Math.cos(angle) * dist * radius;
          const y = radius + Math.sin(angle) * dist * radius;
          const waiting = waitingId === d.id;

          return (
            <Pressable
              key={d.id}
              accessibilityLabel={`Challenge player ${i + 1}`}
              onPress={() => onSelect(d.id)}
              disabled={waitingId !== null}
              style={{
                position: "absolute",
                left: x - 28,
                top: y - 28,
                width: 56,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Glow color={c.accent} />
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: c.accent,
                  borderWidth: waiting ? 4 : 3,
                  borderColor: waiting ? c.ink : c.bar,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 46,
                  backgroundColor: c.bar,
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 11, fontWeight: "700", color: c.ink }}
                >
                  {waiting ? "Waiting..." : `Player ${i + 1}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}