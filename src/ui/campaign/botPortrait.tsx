import { useEffect, useState } from "react";
import { Animated, Easing, Image, Text } from "react-native";

import { BOT_IMAGES } from "@/ui/campaign/botImages";
import { useTheme } from "@/ui/theme/useTheme";

/** Stand-in picture until a bot has a real image. \uFE0E keeps it as text, not an emoji. */
function placeholderPiece(level: number): string {
  const glyph =
    level <= 3 ? "♟" : level <= 6 ? "♞" : level <= 9 ? "♝" : level <= 12 ? "♜" : level <= 14 ? "♛" : "♚";
  return `${glyph}\uFE0E`;
}

type Props = { level: number; animate?: boolean };

export function BotPortrait({ level, animate = true }: Props) {
  "use no memo";
  const ink = useTheme().colors.ink;
  const image = BOT_IMAGES[level];
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate) return;
    const duration = 1700 + (level % 5) * 160; // each bot breathes at its own pace
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, animate, level]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      {image ? (
        <Image source={image} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ fontSize: 28, color: ink }}>{placeholderPiece(level)}</Text>
      )}
    </Animated.View>
  );
}