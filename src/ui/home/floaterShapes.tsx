import type { ReactNode } from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

export type ShapeKind =
  | "leaf"
  | "ring"
  | "drop"
  | "flower"
  | "heart"
  | "acorn"
  | "cup"
  | "star"
  | "balloon"
  | "squiggle"
  | "diamond"
  | "sparkle"
  | "gear"
  | "bolt"
  | "shuriken"
  | "moon"
  | "planet"
  | "rocket"
  | "banana"
  | "pumpkin"
  | "bat"
  | "ghost";

type Props = { kind: ShapeKind; size: number; color: string; cut: string };

export function FloaterShape({ kind, size, color, cut }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw(kind, color, cut)}
    </Svg>
  );
}

function draw(kind: ShapeKind, c: string, cut: string): ReactNode {
  switch (kind) {
    case "leaf":
      return (
        <>
          <Path d="M12 2C19 6 20 14 12 22C4 14 5 6 12 2Z" fill={c} />
          <Path
            d="M12 7V21"
            stroke={cut}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </>
      );
    case "ring":
      return (
        <Circle cx={12} cy={12} r={8} fill="none" stroke={c} strokeWidth={3} />
      );
    case "drop":
      return (
        <Path
          d="M12 2C16 8 19 11 19 15A7 7 0 0 1 5 15C5 11 8 8 12 2Z"
          fill={c}
        />
      );
    case "flower":
      return (
        <>
          <Circle cx={12} cy={5.5} r={4} fill={c} />
          <Circle cx={18.2} cy={10} r={4} fill={c} />
          <Circle cx={15.8} cy={17.3} r={4} fill={c} />
          <Circle cx={8.2} cy={17.3} r={4} fill={c} />
          <Circle cx={5.8} cy={10} r={4} fill={c} />
          <Circle cx={12} cy={12} r={2.6} fill={cut} />
        </>
      );
    case "heart":
      return (
        <Path
          d="M12 21C4 14 2 10 2 7A5 5 0 0 1 12 6A5 5 0 0 1 22 7C22 10 20 14 12 21Z"
          fill={c}
        />
      );
    case "acorn":
      return (
        <>
          <Rect x={11} y={2.5} width={2} height={4} rx={1} fill={c} />
          <Path d="M5 10.5A7 5.5 0 0 1 19 10.5Z" fill={c} />
          <Path
            d="M6.5 11.5H17.5C17.5 17 14.5 21 12 22C9.5 21 6.5 17 6.5 11.5Z"
            fill={c}
          />
        </>
      );
    case "cup":
      return (
        <>
          <Path d="M4 9H17V14C17 18 14 20 10.5 20C7 20 4 18 4 14Z" fill={c} />
          <Path
            d="M17 10.5H18.5A2.8 2.8 0 0 1 18.5 16H16.5"
            fill="none"
            stroke={c}
            strokeWidth={1.8}
          />
        </>
      );
    case "star":
      return (
        <Path
          d="M12 2L14.9 8.6L22 9.3L16.6 14L18.2 21L12 17.3L5.8 21L7.4 14L2 9.3L9.1 8.6Z"
          fill={c}
        />
      );
    case "balloon":
      return (
        <>
          <Ellipse cx={12} cy={9} rx={6} ry={7.5} fill={c} />
          <Path d="M12 16.5L10.6 18.6H13.4Z" fill={c} />
          <Path
            d="M12 18.6Q10 20.5 12 23"
            fill="none"
            stroke={c}
            strokeWidth={1.2}
          />
        </>
      );
    case "squiggle":
      return (
        <Path
          d="M3 12Q7.5 3 12 12T21 12"
          fill="none"
          stroke={c}
          strokeWidth={3}
          strokeLinecap="round"
        />
      );
    case "diamond":
      return <Path d="M12 2L21 10L12 22L3 10Z" fill={c} />;
    case "sparkle":
      return (
        <Path
          d="M12 1Q13 11 23 12Q13 13 12 23Q11 13 1 12Q11 11 12 1Z"
          fill={c}
        />
      );
    case "gear":
      return (
        <>
          <Circle
            cx={12}
            cy={12}
            r={9}
            fill="none"
            stroke={c}
            strokeWidth={3.5}
            strokeDasharray="3.53 3.53"
          />
          <Circle cx={12} cy={12} r={6.5} fill={c} />
          <Circle cx={12} cy={12} r={2.6} fill={cut} />
        </>
      );
    case "bolt":
      return <Path d="M14 2L5 13.5H11L9.5 22L19 10H13Z" fill={c} />;
    case "shuriken":
      return (
        <>
          <Path d="M12 1L15 9L23 12L15 15L12 23L9 15L1 12L9 9Z" fill={c} />
          <Circle cx={12} cy={12} r={2} fill={cut} />
        </>
      );
    case "moon":
      return (
        <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={c} />
      );
    case "planet":
      return (
        <>
          <Circle cx={12} cy={12} r={6} fill={c} />
          <Ellipse
            cx={12}
            cy={12}
            rx={11}
            ry={3.4}
            fill="none"
            stroke={c}
            strokeWidth={1.6}
            transform="rotate(-20 12 12)"
          />
        </>
      );
    case "rocket":
      return (
        <>
          <Path d="M12 1C16 5 17 10 16 15H8C7 10 8 5 12 1Z" fill={c} />
          <Path d="M8 12L4 17L8 16Z" fill={c} />
          <Path d="M16 12L20 17L16 16Z" fill={c} />
          <Path d="M10 16L12 22L14 16Z" fill={c} />
        </>
      );
    case "banana":
      return (
        <Path
          d="M5 5C4 13 10 19 19 18"
          fill="none"
          stroke={c}
          strokeWidth={5}
          strokeLinecap="round"
        />
      );
    case "pumpkin":
      return (
        <>
          <Rect x={11} y={3} width={2.5} height={4.5} rx={1} fill={c} />
          <Ellipse cx={7.5} cy={14} rx={4.5} ry={7.5} fill={c} />
          <Ellipse cx={16.5} cy={14} rx={4.5} ry={7.5} fill={c} />
          <Ellipse cx={12} cy={14} rx={5} ry={7.5} fill={c} />
          <Path d="M8 12L10 15H6Z" fill={cut} />
          <Path d="M16 12L18 15H14Z" fill={cut} />
          <Path
            d="M9 18Q12 20 15 18"
            fill="none"
            stroke={cut}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      );
    case "bat":
      return (
        <Path
          d="M12 8C10 6 7 6 2 9C4 10 4 13 6 14C7 12 9 13 10 15L12 13L14 15C15 13 17 12 18 14C20 13 20 10 22 9C17 6 14 6 12 8Z"
          fill={c}
        />
      );
    case "ghost":
      return (
        <>
          <Path
            d="M5 21V11A7 7 0 0 1 19 11V21L16.5 18.5L14 21L12 18.5L10 21L7.5 18.5Z"
            fill={c}
          />
          <Circle cx={9.5} cy={11} r={1.4} fill={cut} />
          <Circle cx={14.5} cy={11} r={1.4} fill={cut} />
        </>
      );
  }
}
