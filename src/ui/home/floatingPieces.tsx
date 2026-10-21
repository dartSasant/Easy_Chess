import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import type { ThemeId } from "@/core/storage/settings";
import { FloaterShape, type ShapeKind } from "@/ui/home/floaterShapes";
import { useTheme } from "@/ui/theme/useTheme";

/** What drifts up the screen in each theme. */
const KINDS: Record<ThemeId, ShapeKind[]> = {
  zen: ["leaf", "ring", "drop", "flower"],
  cozy: ["heart", "acorn", "cup", "leaf"],
  playful: ["star", "balloon", "squiggle", "heart"],
  premium: ["diamond", "sparkle", "ring", "star"],
  gadget: ["gear", "bolt", "sparkle", "ring"],
  ninja: ["shuriken", "leaf", "moon", "ring"],
  space: ["star", "planet", "rocket", "moon", "sparkle"],
  jungle: ["leaf", "banana", "flower", "drop"],
  halloween: ["pumpkin", "bat", "ghost", "moon", "sparkle"],
};

const SLOTS = [
  { left: 0.06, size: 46, duration: 15000, delay: 0 },
  { left: 0.28, size: 34, duration: 11000, delay: 2500 },
  { left: 0.5, size: 40, duration: 17000, delay: 6000 },
  { left: 0.72, size: 44, duration: 13000, delay: 1200 },
  { left: 0.86, size: 38, duration: 16000, delay: 4200 },
  { left: 0.16, size: 36, duration: 18000, delay: 8000 },
  { left: 0.4, size: 32, duration: 14000, delay: 9500 },
  { left: 0.62, size: 42, duration: 19000, delay: 3200 },
];

type ItemProps = {
  kind: ShapeKind;
  left: number; // 0..1 of screen width
  size: number;
  duration: number;
  delay: number;
};

function FloatingItem({ kind, left, size, duration, delay }: ItemProps) {
  "use no memo";
  const { width, height } = useWindowDimensions();
  const colors = useTheme().colors;
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, delay]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: width * left,
        top: height,
        opacity: t.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 0.22, 0.22, 0],
        }),
        transform: [
          {
            translateY: t.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(height + size * 2)],
            }),
          },
          {
            rotate: t.interpolate({
              inputRange: [0, 1],
              outputRange: ["-18deg", "18deg"],
            }),
          },
        ],
      }}
    >
      <FloaterShape
        kind={kind}
        size={size}
        color={colors.ink}
        cut={colors.canvas}
      />
    </Animated.View>
  );
}

/** Theme-specific shapes drifting up behind the home screen. Render it near the top of the screen. */
export function FloatingPieces() {
  const theme = useTheme();
  const kinds = KINDS[theme.id];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {SLOTS.map((s, i) => (
        // the theme id in the key restarts the animations when the theme changes
        <FloatingItem
          key={`${theme.id}-${i}`}
          kind={kinds[i % kinds.length]}
          {...s}
        />
      ))}
    </View>
  );
}
