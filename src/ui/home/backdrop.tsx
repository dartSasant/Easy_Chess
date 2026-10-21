import type { ReactNode } from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Rect,
  G,
  Stop,
} from "react-native-svg";

import type { ThemeId } from "@/core/storage/settings";
import { mix } from "@/ui/theme/colorMIx";
import type { ThemeColors } from "@/ui/theme/themes";
import { useTheme } from "@/ui/theme/useTheme";

/** Helpers: m(t) = canvas toward ink, a(t) = canvas toward accent. Every color stays in the theme. */
const tint = (c: ThemeColors) => ({
  m: (t: number) => mix(c.canvas, c.ink, t),
  a: (t: number) => mix(c.canvas, c.accent, t),
});

const SCENES: Record<ThemeId, (c: ThemeColors) => ReactNode> = {
  // moonlit lake, hills and a lone tree
  zen: (c) => {
    const { m, a } = tint(c);
    return (
      <>
        <Circle cx={285} cy={205} r={36} fill={a(0.6)} />
        <Path
          d="M0 300L90 225L165 285L255 215L335 275L400 240V400H0Z"
          fill={m(0.09)}
        />
        <Path d="M0 335Q100 290 200 325T400 305V400H0Z" fill={m(0.16)} />
        <Path
          d="M70 372Q82 335 76 300"
          stroke={m(0.4)}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={76} cy={288} r={24} fill={a(0.5)} />
        <Circle cx={56} cy={300} r={16} fill={a(0.5)} />
        <Circle cx={98} cy={298} r={16} fill={a(0.5)} />
        <Path d="M0 372Q120 345 240 368T400 355V400H0Z" fill={m(0.26)} />
      </>
    );
  },
  // table with a vase of flowers, a book and a little bird
  cozy: (c) => {
    const { m, a } = tint(c);
    return (
      <>
        <Rect x={0} y={340} width={400} height={60} fill={m(0.2)} />
        <Rect x={0} y={336} width={400} height={6} fill={m(0.3)} />
        <Path
          d="M290 340L296 282Q300 270 316 270Q332 270 336 282L342 340Z"
          fill={a(0.75)}
        />
        <Path
          d="M336 292Q354 292 350 314Q348 322 340 322"
          stroke={a(0.75)}
          strokeWidth={6}
          fill="none"
        />
        <Path
          d="M316 272Q310 232 290 204"
          stroke={m(0.4)}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M318 272Q330 228 350 208"
          stroke={m(0.4)}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx={289} cy={198} r={15} fill={a(0.6)} />
        <Circle cx={351} cy={202} r={15} fill={a(0.6)} />
        <Rect x={80} y={316} width={120} height={24} rx={3} fill={m(0.35)} />
        <Rect x={86} y={322} width={108} height={6} rx={2} fill={m(0.15)} />
        <Ellipse cx={150} cy={304} rx={17} ry={11} fill={m(0.5)} />
        <Circle cx={168} cy={296} r={7} fill={m(0.5)} />
        <Path d="M134 302L118 296L132 310Z" fill={m(0.5)} />
      </>
    );
  },
  // rainbow, clouds and bouncy hills
  playful: (c) => {
    const { m } = tint(c);
    const bands = [
      mix(c.canvas, c.danger, 0.55),
      mix(c.canvas, c.accent, 0.8),
      mix(c.canvas, c.squareDark, 0.7),
      m(0.12),
    ];
    return (
      <>
        {bands.map((col, i) => (
          <Circle
            key={i}
            cx={200}
            cy={440}
            r={205 - i * 24}
            fill="none"
            stroke={col}
            strokeWidth={22}
          />
        ))}
        <Ellipse
          cx={70}
          cy={250}
          rx={38}
          ry={14}
          fill={mix(c.canvas, "#FFFFFF", 0.7)}
        />
        <Ellipse
          cx={92}
          cy={240}
          rx={24}
          ry={12}
          fill={mix(c.canvas, "#FFFFFF", 0.7)}
        />
        <Ellipse
          cx={330}
          cy={225}
          rx={34}
          ry={12}
          fill={mix(c.canvas, "#FFFFFF", 0.7)}
        />
        <Path d="M0 355Q100 312 200 348T400 330V400H0Z" fill={m(0.1)} />
        <Circle cx={60} cy={378} r={7} fill={mix(c.canvas, c.accent, 0.9)} />
        <Circle
          cx={150}
          cy={388}
          r={6}
          fill={mix(c.canvas, c.squareDark, 0.8)}
        />
        <Circle cx={255} cy={380} r={7} fill={mix(c.canvas, c.danger, 0.6)} />
        <Circle cx={345} cy={390} r={6} fill={mix(c.canvas, c.accent, 0.9)} />
      </>
    );
  },
  // art deco sunburst
  premium: (c) => {
    const { m, a } = tint(c);
    const rays = Array.from({ length: 13 }, (_, i) => {
      const th = Math.PI + (i * Math.PI) / 12;
      return { x: 200 + 300 * Math.cos(th), y: 400 + 300 * Math.sin(th) };
    });
    return (
      <>
        {rays.map((p, i) => (
          <Line
            key={i}
            x1={200}
            y1={400}
            x2={p.x}
            y2={p.y}
            stroke={m(0.1)}
            strokeWidth={3}
          />
        ))}
        <Circle
          cx={200}
          cy={400}
          r={250}
          fill="none"
          stroke={m(0.12)}
          strokeWidth={4}
        />
        <Circle
          cx={200}
          cy={400}
          r={190}
          fill="none"
          stroke={m(0.16)}
          strokeWidth={4}
        />
        <Circle
          cx={200}
          cy={400}
          r={130}
          fill="none"
          stroke={m(0.2)}
          strokeWidth={4}
        />
        <Circle cx={200} cy={400} r={80} fill={a(0.7)} />
      </>
    );
  },
  // circuit board
  gadget: (c) => {
    const { m, a } = tint(c);
    const trace = {
      stroke: m(0.22),
      strokeWidth: 4,
      fill: "none" as const,
      strokeLinejoin: "round" as const,
    };
    return (
      <>
        <Path d="M0 380H80L110 350H220L250 320H400" {...trace} />
        <Path d="M0 330H60L90 300H150" {...trace} />
        <Path d="M400 365H330L300 395" {...trace} />
        <Path d="M250 260H330L360 230H400" {...trace} />
        <Rect
          x={160}
          y={285}
          width={84}
          height={58}
          rx={8}
          fill={m(0.1)}
          stroke={m(0.3)}
          strokeWidth={3}
        />
        {[172, 190, 208, 226].map((x) => (
          <Line
            key={x}
            x1={x}
            y1={343}
            x2={x}
            y2={354}
            stroke={m(0.3)}
            strokeWidth={4}
          />
        ))}
        {[
          [0, 380],
          [0, 330],
          [150, 300],
          [400, 320],
          [400, 365],
          [400, 230],
          [250, 260],
        ].map(([x, y]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={7} fill={a(0.8)} />
        ))}
      </>
    );
  },
  // sun, mountains and bamboo
  ninja: (c) => {
    const { m, a } = tint(c);
    return (
      <>
        <Circle cx={300} cy={215} r={46} fill={a(0.55)} />
        <Path
          d="M0 310L80 235L150 295L240 230L330 300L400 260V400H0Z"
          fill={m(0.1)}
        />
        <Path d="M0 345Q110 300 220 340T400 325V400H0Z" fill={m(0.18)} />
        {[38, 72, 362].map((x) => (
          <G key={x}>
            <Line
              x1={x}
              y1={150}
              x2={x}
              y2={400}
              stroke={m(0.35)}
              strokeWidth={8}
              strokeLinecap="round"
            />
            {[225, 290, 350].map((y) => (
              <Rect
                key={y}
                x={x - 7}
                y={y}
                width={14}
                height={4}
                rx={2}
                fill={m(0.5)}
              />
            ))}
          </G>
        ))}
        <Path d="M72 230Q110 215 128 238Q100 236 72 230Z" fill={m(0.35)} />
        <Path d="M362 270Q326 252 306 276Q336 272 362 270Z" fill={m(0.35)} />
      </>
    );
  },
  // ringed planet, small moon and stars
  space: (c) => {
    const { m, a } = tint(c);
    const stars = [
      [40, 180, 2],
      [110, 230, 1.5],
      [190, 190, 2.5],
      [250, 250, 1.5],
      [330, 175, 2],
      [370, 270, 1.5],
      [150, 300, 1.5],
      [60, 285, 2],
      [300, 340, 1.5],
    ];
    return (
      <>
        {stars.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill={m(0.55)} />
        ))}
        <Circle cx={320} cy={250} r={28} fill={m(0.22)} />
        <Circle cx={310} cy={242} r={6} fill={m(0.12)} />
        <Circle cx={332} cy={262} r={4} fill={m(0.12)} />
        <Circle cx={120} cy={395} r={130} fill={a(0.3)} />
        <Ellipse
          cx={120}
          cy={395}
          rx={205}
          ry={34}
          fill="none"
          stroke={m(0.3)}
          strokeWidth={7}
          transform="rotate(-16 120 395)"
        />
        <Path
          d="M0 400V372Q60 352 120 362"
          fill="none"
          stroke={a(0.5)}
          strokeWidth={3}
        />
      </>
    );
  },
  // palm tree and big leaves
  jungle: (c) => {
    const { m, a } = tint(c);
    const frond = {
      stroke: m(0.38),
      strokeWidth: 9,
      fill: "none" as const,
      strokeLinecap: "round" as const,
    };
    return (
      <>
        <Circle cx={310} cy={210} r={34} fill={a(0.5)} />
        <Path d="M0 330Q100 290 200 325T400 300V400H0Z" fill={m(0.12)} />
        <Path
          d="M90 400Q112 322 100 240"
          stroke={m(0.4)}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M100 240Q62 196 20 236" {...frond} />
        <Path d="M100 240Q74 190 52 168" {...frond} />
        <Path d="M100 240Q104 188 126 160" {...frond} />
        <Path d="M100 240Q140 196 184 226" {...frond} />
        <Path d="M100 240Q146 232 178 264" {...frond} />
        <Path d="M400 400Q330 335 300 262Q380 292 400 345Z" fill={m(0.22)} />
        <Path d="M400 400Q350 360 270 352Q320 322 400 360Z" fill={m(0.3)} />
        <Path d="M0 378Q120 350 240 374T400 362V400H0Z" fill={m(0.24)} />
      </>
    );
  },
  // moon, bare tree, hills and pumpkins
  halloween: (c) => {
    const { m, a } = tint(c);
    return (
      <>
        <Circle cx={285} cy={195} r={60} fill={a(0.5)} />
        <Path d="M0 320Q100 280 200 315T400 290V400H0Z" fill={m(0.12)} />
        <Path
          d="M64 400L70 292M70 330L34 296M70 310L104 270M70 292L62 250M104 270L128 262"
          stroke={m(0.4)}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M0 0C-4 -4 -9 -4 -14 0C-11 0 -10 3 -8 4C-6 2 -4 3 -3 5L0 2L3 5C4 3 6 2 8 4C10 3 11 0 14 0C9 -4 4 -4 0 0Z"
          fill={m(0.4)}
          transform="translate(210 215)"
        />
        <Path
          d="M0 0C-4 -4 -9 -4 -14 0C-11 0 -10 3 -8 4C-6 2 -4 3 -3 5L0 2L3 5C4 3 6 2 8 4C10 3 11 0 14 0C9 -4 4 -4 0 0Z"
          fill={m(0.4)}
          transform="translate(250 250) scale(0.8)"
        />
        <Path d="M0 372Q120 345 240 368T400 355V400H0Z" fill={m(0.22)} />
        <Rect x={248} y={336} width={8} height={14} rx={3} fill={m(0.4)} />
        <Ellipse cx={252} cy={374} rx={36} ry={28} fill={a(0.75)} />
        <Ellipse cx={318} cy={384} rx={24} ry={19} fill={a(0.65)} />
        <Rect x={314} y={360} width={6} height={10} rx={2} fill={m(0.4)} />
      </>
    );
  },
};

/** Faded illustration at the bottom of the screen, tinted from the theme so it blends into the canvas. */
export function Backdrop() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const c = theme.colors;
  const h = Math.round(height * 0.5);

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h }}
    >
      <Svg
        width={width}
        height={h}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMax slice"
      >
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.canvas} stopOpacity={1} />
            <Stop offset="1" stopColor={c.canvas} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {SCENES[theme.id](c)}
        <Rect x={0} y={0} width={400} height={150} fill="url(#fade)" />
      </Svg>
    </View>
  );
}
