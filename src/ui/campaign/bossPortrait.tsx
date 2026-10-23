import { useEffect, useState, type ComponentType } from "react";
import { Animated, Easing, View } from "react-native";

import { BOSSES } from "@/core/bots/bosses";
import type { ThemeId } from "@/core/storage/settings";
import { GadgetRobot, NinjaMascot, SpookyGhost } from "@/ui/home/bossArt";
import {
  CozyBear,
  JungleMonkey,
  PlayfulBlob,
  PremiumOwl,
  SpaceAlien,
  ZenFrog,
} from "@/ui/home/mascotArt";
import { THEMES, type ThemeColors } from "@/ui/theme/themes";

const ART: Record<ThemeId, ComponentType<{ c: ThemeColors }>> = {
  zen: ZenFrog,
  cozy: CozyBear,
  playful: PlayfulBlob,
  premium: PremiumOwl,
  gadget: GadgetRobot,
  ninja: NinjaMascot,
  space: SpaceAlien,
  jungle: JungleMonkey,
  halloween: SpookyGhost,
};

type Props = { index: number; animate?: boolean };

/** The boss's mascot, drawn in its own theme's colors, scaled to fill its box. */
export function BossPortrait({ index, animate = true }: Props) {
  "use no memo";
  const boss = BOSSES[index - 1];
  const Art = ART[boss.themeId];
  const colors = THEMES[boss.themeId].colors;
  const [size, setSize] = useState(0);
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate) return;
    const duration = 1500 + (index % 4) * 180;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, animate, index]);

  const bob = t.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <View
      style={{ width: "100%", height: "100%" }}
      onLayout={(e) => setSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateY: bob }],
        }}
      >
        {size > 0 && (
          <View style={{ width: 110, height: 110, transform: [{ scale: (size / 110) * 0.92 }] }}>
            <Art c={colors} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
