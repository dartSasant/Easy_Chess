import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { Color, PieceType } from "@/core/game";
import { PieceView } from "@/ui/board/pieceView";
import { useTheme } from "@/ui/theme/useTheme";
import { formatClock } from "./useGameClock";

type Props = {
  name: string;
  /** Small pill next to the name, for example "Level 3". */
  subtitle?: string;
  captured: PieceType[];
  capturedColor: Color;
  seconds: number;
  active: boolean;
  /** Replaces the letter circle, for example with a bot portrait. */
  avatar?: ReactNode;
  /** Extra row under the bar, for example the Resign and Offer draw buttons. */
  children?: ReactNode;
};

/** A slim player bar: avatar, name, captured pieces and a clock pill. The side to move glows. */
export function PlayerCard({
  name,
  subtitle,
  captured,
  capturedColor,
  seconds,
  active,
  avatar,
  children,
}: Props) {
  "use no memo";
  const pieceStyle = useTheme().pieceStyle;

  return (
    <View
      className={`mx-3 my-1.5 rounded-2xl bg-bar px-3 py-2 ${
        active ? "border-2 border-accent" : "border-2 border-transparent"
      }`}
    >
      <View className="flex-row items-center">
        {avatar ? (
          <View className="h-11 w-11 overflow-hidden rounded-full">{avatar}</View>
        ) : (
          <View
            className={`h-11 w-11 items-center justify-center rounded-full bg-accent border-2 ${
              active ? "border-ink" : "border-transparent"
            }`}
          >
            <Text className="text-lg font-bold text-ink">{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-ink" numberOfLines={1} style={{ flexShrink: 1 }}>
              {name}
            </Text>
            {subtitle ? (
              <View className="ml-2 rounded-full bg-canvas px-2 py-0.5">
                <Text className="text-xs font-bold text-ink">{subtitle}</Text>
              </View>
            ) : null}
          </View>
          <View className="h-5 flex-row" style={{ overflow: "hidden" }}>
            {captured.map((type, i) => (
              <View key={i} style={{ marginRight: -6 }}>
                <PieceView piece={{ color: capturedColor, type }} size={20} styleId={pieceStyle} />
              </View>
            ))}
          </View>
        </View>

        <View className={`rounded-full px-3 py-1.5 ${active ? "bg-accent" : "bg-canvas"}`}>
          <Text className="text-base font-bold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
            {formatClock(seconds)}
          </Text>
        </View>
      </View>

      {children ? <View className="mt-2 flex-row justify-end">{children}</View> : null}
    </View>
  );
}
