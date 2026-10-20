import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";

import { useTheme } from "@/ui/theme/useTheme";

type Floater = {
  glyph: string;
  left: number; // 0..1 of screen width
  size: number;
  duration: number;
  delay: number;
};

const FLOATERS: Floater[] = [
  { glyph: "♞", left: 0.06, size: 46, duration: 15000, delay: 0 },
  { glyph: "♟", left: 0.28, size: 34, duration: 11000, delay: 2500 },
  { glyph: "♜", left: 0.5, size: 40, duration: 17000, delay: 6000 },
  { glyph: "♝", left: 0.72, size: 44, duration: 13000, delay: 1200 },
  { glyph: "♛", left: 0.86, size: 38, duration: 16000, delay: 4200 },
  { glyph: "♚", left: 0.16, size: 36, duration: 18000, delay: 8000 },
];

function FloatingPiece({ glyph, left, size, duration, delay }: Floater) {
  "use no memo";
  const { width, height } = useWindowDimensions();
  const color = useTheme().colors.ink;
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
    <Animated.Text
      style={{
        position: "absolute",
        left: width * left,
        top: height,
        fontSize: size,
        color,
        opacity: t.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 0.22, 0.22, 0],
        }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + size * 2)] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "18deg"] }) },
        ],
      }}
    >
      {glyph}
    </Animated.Text>
  );
}

/** Chess pieces drifting up behind the home screen. Put it first inside the screen. */
export function FloatingPieces() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {FLOATERS.map((f) => (
        <FloatingPiece key={f.glyph} {...f} />
      ))}
    </View>
  );
}