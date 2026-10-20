import type { ScanResult } from "expo-ble-kit";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from "react-native";

import { useTheme } from "@/ui/theme/useTheme";

function hash(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h;
}

function Pulse({ delay, size, color }: { delay: number; size: number; color: string }) {
  "use no memo";
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const run = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(t, {
          toValue: 1,
          duration: 2600,
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
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }) }],
      }}
    />
  );
}

function Glow({ color }: { color: string }) {
  "use no memo";
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] }) }],
      }}
    />
  );
}

type Props = {
  devices: ScanResult[];
  /** Id of the phone we challenged and are waiting for. */
  waitingId: string | null;
  onSelect: (id: string) => void;
};

export function Radar({ devices, waitingId, onSelect }: Props) {
  "use no memo";
  const { width } = useWindowDimensions();
  const c = useTheme().colors;
  const size = Math.min(width - 32, 320);
  const radius = size / 2;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        {/* Rings */}
        {[1, 0.66, 0.33].map((f) => (
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
              borderWidth: 1,
              borderColor: c.ink,
              opacity: 0.2,
            }}
          />
        ))}

        {/* The sweeping pulses */}
        <View style={{ position: "absolute", left: 0, top: 0, width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          <Pulse delay={0} size={size} color={c.accent} />
          <Pulse delay={1300} size={size} color={c.accent} />
        </View>

        {/* You */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: radius - 7,
            top: radius - 7,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: c.ink,
          }}
        />

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
                left: x - 26,
                top: y - 26,
                width: 52,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Glow color={c.accent} />
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: c.accent,
                  borderWidth: waiting ? 3 : 2,
                  borderColor: c.ink,
                }}
              />
              <Text style={{ position: "absolute", top: 44, fontSize: 10, color: c.ink, width: 70, textAlign: "center" }}>
                {waiting ? "Waiting..." : `Player ${i + 1}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}