import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import type { ThemeColors } from "@/ui/theme/themes";

type P = { c: ThemeColors };
const D = "#1F1A2E";

export function GadgetRobot({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Line x1={60} y1={14} x2={60} y2={28} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={60} cy={12} r={6} fill={c.accent} stroke={c.ink} strokeWidth={3} />
      <Rect x={14} y={50} width={10} height={22} rx={4} fill={c.accent} stroke={c.ink} strokeWidth={3} />
      <Rect x={96} y={50} width={10} height={22} rx={4} fill={c.accent} stroke={c.ink} strokeWidth={3} />
      <Rect x={22} y={28} width={76} height={66} rx={16} fill={c.squareDark} stroke={c.ink} strokeWidth={4} />
      <Rect x={32} y={42} width={56} height={34} rx={10} fill={c.bar} />
      <Circle cx={47} cy={58} r={7} fill={D} />
      <Circle cx={73} cy={58} r={7} fill={D} />
      <Circle cx={49} cy={55.5} r={2.2} fill="#FFFFFF" />
      <Circle cx={75} cy={55.5} r={2.2} fill="#FFFFFF" />
      <Path d="M48 68Q60 77 72 68" stroke={D} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Rect x={40} y={94} width={40} height={14} rx={5} fill={c.accent} stroke={c.ink} strokeWidth={3} />
    </Svg>
  );
}

export function NinjaMascot({ c }: P) {
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      <Circle cx={60} cy={64} r={42} fill={c.squareDark} stroke={c.ink} strokeWidth={4} />
      <Rect x={22} y={52} width={76} height={26} rx={13} fill="#F2D4B0" stroke={c.ink} strokeWidth={3} />
      <Circle cx={46} cy={65} r={4.5} fill={D} />
      <Circle cx={74} cy={65} r={4.5} fill={D} />
      <Path d="M38 58L54 62M82 58L66 62" stroke={D} strokeWidth={3} strokeLinecap="round" />
      <Rect x={16} y={34} width={88} height={13} rx={6.5} fill={c.accent} stroke={c.ink} strokeWidth={3} />
      <Path d="M102 40L116 30M102 42L116 52" stroke={c.accent} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

/** White ghost holding a heart, standing in a dark ink puddle. */
export function SpookyGhost({ c }: P) {
  const body = "#FBF5EA";
  return (
    <Svg width={110} height={110} viewBox="0 0 120 120">
      {/* soft ground shadow */}
      <Ellipse cx={62} cy={115} rx={30} ry={3.5} fill="#4B4B77" opacity={0.25} />

      {/* body with natural wavy sheet hem */}
      <Path
        d="M28 102V52Q28 12 62 12Q96 12 96 52V102Q92 114 84 106Q78 98 72 106Q65 116 56 106Q50 98 44 106Q36 114 28 102Z"
        fill={body}
        stroke="#CFC6D8"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* subtle fabric folds */}
      <Path
        d="M45 92Q47 99 44 105M72 92Q70 99 72 105"
        stroke="#E3D8C6"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />

      {/* cute worried eyebrows (inner ends raised) */}
      <Path
        d="M39 34Q42 30 47 28M85 34Q82 30 77 28"
        stroke={D}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <Ellipse cx={50} cy={46} rx={7} ry={9.5} fill="#2A2A45" />
      <Ellipse cx={74} cy={46} rx={7} ry={9.5} fill="#2A2A45" />

      {/* eye highlights */}
      <Circle cx={48} cy={42} r={2.4} fill="#FFFFFF" />
      <Circle cx={72} cy={42} r={2.4} fill="#FFFFFF" />
      <Circle cx={51} cy={49} r={1} fill="#FFFFFF" />
      <Circle cx={75} cy={49} r={1} fill="#FFFFFF" />

      {/* blush */}
      <Ellipse cx={40} cy={59} rx={5.5} ry={3.2} fill="#E7B8E0" opacity={0.85} />
      <Ellipse cx={84} cy={59} rx={5.5} ry={3.2} fill="#E7B8E0" opacity={0.85} />

      {/* heart */}
      <Path
        d="M62 82L49 69Q45 62 51 58Q57 55 62 62Q67 55 73 58Q79 62 75 69Z"
        fill="#E5566A"
      />

      {/* arms hugging the heart */}
      <Path
        d="M34 66Q41 76 53 71M90 66Q83 76 71 71"
        stroke={D}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
