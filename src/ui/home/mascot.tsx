import { useEffect, useState, type ComponentType } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import type { ThemeId } from "@/core/storage/settings";
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

type P = { c: ThemeColors };

/** Size of every mascot drawing, in points. */
export const MASCOT_SIZE = 110;

/** Same dark face color the other mascots use. */
const D = "#1F1A2E";

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

// ---- blinking ----------------------------------------------------------------------------

/** An eyelid: a patch in the face color that covers one eye, plus the line of the closed eye. */
type Lid = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
  fill: string;
  line: string;
  stroke: string;
  width?: number;
};

/** Eye positions are in the same 120 x 120 space as the drawings. */
const BLINKS: Record<ThemeId, (c: ThemeColors) => Lid[]> = {
  // The frog's eyes are already drawn closed, so it has nothing to blink.
  zen: () => [],
  cozy: () => [
    {
      cx: 42,
      cy: 56,
      rx: 6.5,
      ry: 6.5,
      fill: "#C48A58",
      line: "M36.5 56Q42 61 47.5 56",
      stroke: D,
      width: 3,
    },
    {
      cx: 78,
      cy: 56,
      rx: 6.5,
      ry: 6.5,
      fill: "#C48A58",
      line: "M72.5 56Q78 61 83.5 56",
      stroke: D,
      width: 3,
    },
  ],
  playful: (c) => [
    {
      cx: 44,
      cy: 66,
      rx: 12,
      ry: 12,
      fill: c.accent,
      line: "M34 67Q44 74 54 67",
      stroke: c.ink,
    },
    {
      cx: 76,
      cy: 66,
      rx: 12,
      ry: 12,
      fill: c.accent,
      line: "M66 67Q76 74 86 67",
      stroke: c.ink,
    },
  ],
  premium: (c) => [
    {
      cx: 44,
      cy: 54,
      rx: 15.8,
      ry: 15.8,
      fill: c.squareDark,
      line: "M33 55Q44 63 55 55",
      stroke: c.ink,
    },
    {
      cx: 76,
      cy: 54,
      rx: 15.5,
      ry: 15.5,
      fill: c.squareDark,
      line: "M65 55Q76 63 87 55",
      stroke: c.ink,
    },
  ],
  gadget: (c) => [
    {
      cx: 45,
      cy: 60,
      rx: 8,
      ry: 8,
      fill: c.canvas,
      line: "M38.5 61Q45 66.5 51.5 61",
      stroke: c.ink,
    },
    {
      cx: 75,
      cy: 60,
      rx: 8,
      ry: 8,
      fill: c.canvas,
      line: "M68.5 61Q75 66.5 81.5 61",
      stroke: c.ink,
    },
  ],
  ninja: (c) => [
    {
      cx: 45,
      cy: 76,
      rx: 7.5,
      ry: 9.5,
      fill: c.bar,
      line: "M39 77Q45 82 51 77",
      stroke: c.ink,
    },
    {
      cx: 75,
      cy: 76,
      rx: 7.5,
      ry: 9.5,
      fill: c.bar,
      line: "M69 77Q75 82 81 77",
      stroke: c.ink,
    },
  ],
  space: () => [
    {
      cx: 42,
      cy: 58,
      rx: 14.5,
      ry: 20.5,
      rotate: 20,
      fill: "#8FE3A0",
      line: "M30 62Q42 72 54 62",
      stroke: D,
    },
    {
      cx: 78,
      cy: 58,
      rx: 14.5,
      ry: 20.5,
      rotate: -20,
      fill: "#8FE3A0",
      line: "M66 62Q78 72 90 62",
      stroke: D,
    },
  ],
  jungle: () => [
    {
      cx: 48,
      cy: 60,
      rx: 6.5,
      ry: 6.5,
      fill: "#F0C9A0",
      line: "M42 61Q48 66 54 61",
      stroke: D,
    },
    {
      cx: 72,
      cy: 60,
      rx: 6.5,
      ry: 6.5,
      fill: "#F0C9A0",
      line: "M66 61Q72 66 78 61",
      stroke: D,
    },
  ],
  halloween: () => [
    {
      cx: 45,
      cy: 70,
      rx: 10.5,
      ry: 10.5,
      fill: "#1A1226",
      line: "M36.5 71Q45 77 53.5 71",
      stroke: "#F29A1F",
      width: 3,
    },
    {
      cx: 75,
      cy: 70,
      rx: 10.5,
      ry: 10.5,
      fill: "#1A1226",
      line: "M66.5 71Q75 77 83.5 71",
      stroke: "#F29A1F",
      width: 3,
    },
  ],
};

function BlinkLayer({
  lids,
  opacity,
}: {
  lids: Lid[];
  opacity: Animated.Value;
}) {
  "use no memo";
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: MASCOT_SIZE,
        height: MASCOT_SIZE,
        opacity,
      }}
    >
      <Svg width={MASCOT_SIZE} height={MASCOT_SIZE} viewBox="0 0 120 120">
        {lids.map((l, i) => (
          <Ellipse
            key={`lid-${i}`}
            cx={l.cx}
            cy={l.cy}
            rx={l.rx}
            ry={l.ry}
            fill={l.fill}
            transform={
              l.rotate ? `rotate(${l.rotate} ${l.cx} ${l.cy})` : undefined
            }
          />
        ))}
        {lids.map((l, i) => (
          <Path
            key={`line-${i}`}
            d={l.line}
            stroke={l.stroke}
            strokeWidth={l.width ?? 3.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

const BLINK_GAP_MS: [number, number] = [2200, 7000]; // time between blinks
const BLINK_SKIP = 0.3; // chance that a blink is skipped
const BLINK_DOUBLE = 0.2; // chance that a blink is a double blink

/**
 * Just the mascot drawing for the current theme (110 x 110), blinking now and then.
 * The peeking behaviour, speech bubble and theme menu live in src/ui/mascot/.
 */
export function MascotFigure() {
  "use no memo";
  const theme = useTheme();
  const Art = ART[theme.id];
  const lids = BLINKS[theme.id](theme.colors);
  const [blink] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (BLINKS[theme.id](theme.colors).length === 0) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const once = () =>
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 1,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

    const schedule = () => {
      const [min, max] = BLINK_GAP_MS;
      timer = setTimeout(
        () => {
          if (!alive) return;
          if (Math.random() < BLINK_SKIP) {
            schedule(); // sometimes it just does not blink
            return;
          }
          const anim =
            Math.random() < BLINK_DOUBLE
              ? Animated.sequence([once(), Animated.delay(110), once()])
              : once();
          anim.start(() => {
            if (alive) schedule();
          });
        },
        min + Math.random() * (max - min),
      );
    };
    schedule();

    return () => {
      alive = false;
      clearTimeout(timer);
      blink.stopAnimation();
      blink.setValue(0);
    };
  }, [theme.id, theme.colors, blink]);

  return (
    <View style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}>
      <Art c={theme.colors} />
      {lids.length > 0 ? <BlinkLayer lids={lids} opacity={blink} /> : null}
    </View>
  );
}
