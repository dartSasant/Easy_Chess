import { SpookyGhost } from "@/ui/home/bossArt";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import type { ThemeColors } from "@/ui/theme/themes";

type P = { c: ThemeColors };

/** Fixed dark color for faces so they stay readable on both light and dark themes. */
const D = "#1F1A2E";

export function ZenFrog({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Ellipse
        cx={60}
        cy={80}
        rx={42}
        ry={32}
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle
        cx={36}
        cy={44}
        r={15}
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle
        cx={84}
        cy={44}
        r={15}
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Path
        d="M28 44Q36 52 44 44"
        stroke={D}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M76 44Q84 52 92 44"
        stroke={D}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={60} cy={92} rx={24} ry={16} fill={c.bar} />
      <Circle cx={30} cy={78} r={6} fill={c.accent} opacity={0.6} />
      <Circle cx={90} cy={78} r={6} fill={c.accent} opacity={0.6} />
      <Circle cx={56} cy={68} r={1.8} fill={D} />
      <Circle cx={64} cy={68} r={1.8} fill={D} />
      <Path
        d="M46 84Q60 96 74 84"
        stroke={D}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function CozyBear({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Circle
        cx={28}
        cy={30}
        r={15}
        fill="#B07A4F"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle
        cx={92}
        cy={30}
        r={15}
        fill="#B07A4F"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle cx={28} cy={30} r={7} fill="#E3B98F" />
      <Circle cx={92} cy={30} r={7} fill="#E3B98F" />
      <Circle
        cx={60}
        cy={64}
        r={42}
        fill="#C48A58"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Ellipse cx={60} cy={78} rx={18} ry={14} fill={c.bar} />
      <Ellipse cx={60} cy={71} rx={6.5} ry={4.5} fill={D} />
      <Circle cx={42} cy={56} r={5} fill={D} />
      <Circle cx={78} cy={56} r={5} fill={D} />
      <Circle cx={44} cy={54} r={1.8} fill="#FFFFFF" />
      <Circle cx={80} cy={54} r={1.8} fill="#FFFFFF" />
      <Circle cx={32} cy={72} r={6} fill={c.accent} opacity={0.5} />
      <Circle cx={88} cy={72} r={6} fill={c.accent} opacity={0.5} />
      <Path
        d="M60 75V80M52 84Q60 90 68 84"
        stroke={D}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function PlayfulBlob({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Path
        d="M16 96Q8 42 60 36Q112 42 104 96Q60 110 16 96Z"
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d="M46 40L60 8L74 40Z"
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Circle
        cx={60}
        cy={8}
        r={5}
        fill={c.bar}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle
        cx={44}
        cy={66}
        r={10}
        fill="#FFFFFF"
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle
        cx={76}
        cy={66}
        r={10}
        fill="#FFFFFF"
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle cx={46} cy={67} r={5} fill={D} />
      <Circle cx={78} cy={67} r={5} fill={D} />
      <Path d="M42 84Q60 102 78 84Z" fill={D} />
      <Ellipse cx={60} cy={92} rx={7} ry={4} fill="#FF6F91" />
      <Circle cx={26} cy={80} r={5} fill="#FFFFFF" opacity={0.5} />
      <Circle cx={94} cy={80} r={5} fill="#FFFFFF" opacity={0.5} />
    </Svg>
  );
}

export function PremiumOwl({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Path
        d="M26 38L22 14L46 28Z"
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d="M94 38L98 14L74 28Z"
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Ellipse
        cx={60}
        cy={68}
        rx={40}
        ry={42}
        fill={c.squareDark}
        stroke={c.ink}
        strokeWidth={4}
      />
      <Ellipse cx={60} cy={84} rx={24} ry={24} fill={c.bar} />
      <Path
        d="M48 80Q54 86 60 80M60 80Q66 86 72 80M52 92Q60 98 68 92"
        stroke={c.accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle
        cx={44}
        cy={54}
        r={14}
        fill="#FFFFFF"
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle
        cx={76}
        cy={54}
        r={14}
        fill="#FFFFFF"
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle cx={46} cy={55} r={6.5} fill={D} />
      <Circle cx={74} cy={55} r={6.5} fill={D} />
      <Circle cx={48} cy={52} r={2} fill="#FFFFFF" />
      <Circle cx={76} cy={52} r={2} fill="#FFFFFF" />
      <Circle
        cx={76}
        cy={54}
        r={17}
        fill="none"
        stroke={c.accent}
        strokeWidth={3}
      />
      <Path
        d="M90 64Q98 82 92 96"
        stroke={c.accent}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M54 64L66 64L60 76Z"
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SpaceAlien({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Line
        x1={44}
        y1={22}
        x2={34}
        y2={8}
        stroke={c.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={76}
        y1={22}
        x2={86}
        y2={8}
        stroke={c.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle
        cx={34}
        cy={7}
        r={5}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Circle
        cx={86}
        cy={7}
        r={5}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={3}
      />
      <Path
        d="M60 14C98 14 108 52 90 84C80 100 40 100 30 84C12 52 22 14 60 14Z"
        fill="#8FE3A0"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Ellipse
        cx={42}
        cy={58}
        rx={13}
        ry={19}
        fill={D}
        transform="rotate(20 42 58)"
      />
      <Ellipse
        cx={78}
        cy={58}
        rx={13}
        ry={19}
        fill={D}
        transform="rotate(-20 78 58)"
      />
      <Circle cx={38} cy={52} r={4} fill="#FFFFFF" />
      <Circle cx={74} cy={52} r={4} fill="#FFFFFF" />
      <Path
        d="M52 86Q60 92 68 86"
        stroke={D}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={30} cy={80} r={4} fill={c.accent} opacity={0.6} />
      <Circle cx={90} cy={80} r={4} fill={c.accent} opacity={0.6} />
    </Svg>
  );
}

export function JungleMonkey({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Circle
        cx={22}
        cy={62}
        r={13}
        fill="#8B5A33"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle
        cx={98}
        cy={62}
        r={13}
        fill="#8B5A33"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Circle cx={22} cy={62} r={6} fill="#E8B88A" />
      <Circle cx={98} cy={62} r={6} fill="#E8B88A" />
      <Circle
        cx={60}
        cy={58}
        r={38}
        fill="#8B5A33"
        stroke={c.ink}
        strokeWidth={4}
      />
      <Path
        d="M60 44C46 40 34 52 36 66C38 80 48 92 60 92C72 92 82 80 84 66C86 52 74 40 60 44Z"
        fill="#F0C9A0"
      />
      <Circle cx={48} cy={60} r={5} fill={D} />
      <Circle cx={72} cy={60} r={5} fill={D} />
      <Circle cx={50} cy={58} r={1.8} fill="#FFFFFF" />
      <Circle cx={74} cy={58} r={1.8} fill="#FFFFFF" />
      <Circle cx={55} cy={74} r={1.8} fill={D} />
      <Circle cx={65} cy={74} r={1.8} fill={D} />
      <Path
        d="M48 80Q60 90 72 80"
        stroke={D}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M54 22Q60 10 66 22"
        stroke={D}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M94 106Q106 98 114 82"
        stroke="#FFD84D"
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** The Spooky Night mascot is the ghost. */
export function HalloweenCat({ c }: P) {
  return <SpookyGhost c={c} />;
}
