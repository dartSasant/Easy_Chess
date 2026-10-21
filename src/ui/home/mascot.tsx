import { useState, type ComponentType } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import { feedback } from "@/core/feedback";
import type { ThemeId } from "@/core/storage/settings";
import { BounceButton } from "@/ui/home/bounceButton";
import {
  CozyBear,
  HalloweenCat,
  JungleMonkey,
  PlayfulBlob,
  PremiumOwl,
  SpaceAlien,
  ZenFrog,
} from "@/ui/home/mascotArt";
import type { ThemeColors } from "@/ui/theme/themes";
import { useTheme } from "@/ui/theme/useTheme";

const LINES = [
  "Oh, you're back. Did you miss losing?",
  "Welcome back! I rearranged the pieces so you can't blame them this time.",
  "Look who thinks they're a grandmaster today.",
  "Ready to lose with style? Let's go.",
  "Fresh day, same moves. Impressive consistency.",
  "Take your time. Not that it helps.",
  "Stop poking me. I have feelings. Small ones.",
  "Boop. Happy now?",
];

type P = { c: ThemeColors };

function Robot({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Line
        x1={60}
        y1={14}
        x2={60}
        y2={28}
        stroke={c.ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle
        cx={60}
        cy={12}
        r={6}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Rect
        x={8}
        y={56}
        width={14}
        height={22}
        rx={6}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Rect
        x={98}
        y={56}
        width={14}
        height={22}
        rx={6}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Rect
        x={20}
        y={28}
        width={80}
        height={72}
        rx={28}
        fill={c.bar}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Ellipse cx={60} cy={68} rx={32} ry={25} fill={c.canvas} />
      <Circle cx={45} cy={60} r={7} fill={c.ink} />
      <Circle cx={75} cy={60} r={7} fill={c.ink} />
      <Circle cx={47} cy={58} r={2.5} fill="#FFFFFF" />
      <Circle cx={77} cy={58} r={2.5} fill="#FFFFFF" />
      <Circle cx={36} cy={74} r={5} fill={c.accent} opacity={0.6} />
      <Circle cx={84} cy={74} r={5} fill={c.accent} opacity={0.6} />
      <Path
        d="M44 78 Q60 92 76 78"
        stroke={c.ink}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function NinjaKid({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Path d="M98 50 L116 40 L112 58 Z" fill={c.ink} />
      <Circle
        cx={60}
        cy={66}
        r={42}
        fill={c.bar}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Rect x={18} y={40} width={84} height={20} rx={4} fill={c.ink} />
      <Rect x={50} y={42} width={20} height={16} rx={3} fill={c.accent} />
      <Ellipse cx={45} cy={76} rx={6} ry={8} fill={c.ink} />
      <Ellipse cx={75} cy={76} rx={6} ry={8} fill={c.ink} />
      <Circle cx={47} cy={73} r={2.5} fill="#FFFFFF" />
      <Circle cx={77} cy={73} r={2.5} fill="#FFFFFF" />
      <Path
        d="M48 92 Q60 100 72 92"
        stroke={c.ink}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** One mascot per theme. */
const ART: Record<ThemeId, ComponentType<P>> = {
  zen: ZenFrog,
  cozy: CozyBear,
  playful: PlayfulBlob,
  premium: PremiumOwl,
  gadget: Robot,
  ninja: NinjaKid,
  space: SpaceAlien,
  jungle: JungleMonkey,
  halloween: HalloweenCat,
};

/** Home-screen mascot with a speech bubble. Tap it for another line. */
export function Mascot() {
  "use no memo";
  const theme = useTheme();
  const [line, setLine] = useState(
    () => LINES[Math.floor(Math.random() * LINES.length)],
  );

  const c = theme.colors;
  const Art = ART[theme.id];

  return (
    <View className="items-center">
      <View className="max-w-[260px] rounded-2xl bg-bar px-4 py-2">
        <Text className="text-center text-sm text-ink">{line}</Text>
      </View>
      {/* little tail pointing at the mascot */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 10,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: c.bar,
        }}
      />
      <BounceButton
        accessibilityLabel="Mascot"
        onPress={() => {
          feedback.tap();
          setLine((old) => {
            let next = old;
            while (next === old)
              next = LINES[Math.floor(Math.random() * LINES.length)];
            return next;
          });
        }}
      >
        <Art c={c} />
      </BounceButton>
    </View>
  );
}
