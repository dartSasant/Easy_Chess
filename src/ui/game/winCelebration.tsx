import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";

const COLORS = ["#F5C542", "#E4572E", "#4DA3E0", "#7CCB6B", "#FF8FB8", "#9B6BFF"];
const COUNT = 28;

function Piece({ index }: { index: number }) {
  "use no memo";
  const { width, height } = useWindowDimensions();
  const [t] = useState(() => new Animated.Value(0));
  const [cfg] = useState(() => ({
    x: Math.random() * width,
    delay: Math.random() * 700,
    duration: 1800 + Math.random() * 1400,
    size: 8 + Math.random() * 6,
    sway: (Math.random() - 0.5) * 90,
    spin: 1 + Math.random() * 3,
  }));

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: cfg.duration,
      delay: cfg.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [t, cfg]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: cfg.x,
        top: -20,
        width: cfg.size,
        height: cfg.size * 1.6,
        backgroundColor: COLORS[index % COLORS.length],
        opacity: t.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.sway] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${cfg.spin * 360}deg`] }) },
        ],
      }}
    />
  );
}

/** One burst of confetti falling over the screen. Taps pass through. */
export function Confetti() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}

/** Trophy that pops in. */
export function Trophy() {
  "use no memo";
  const [s] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(s, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  }, [s]);

  return <Animated.Text style={{ fontSize: 44, transform: [{ scale: s }] }}>🏆</Animated.Text>;
}