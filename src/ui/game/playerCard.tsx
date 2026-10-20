import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { Color, PieceType } from "@/core/game";
import { PieceView } from "@/ui/board/pieceView";
import { useTheme } from "@/ui/theme/useTheme";
import { formatClock } from "./useGameClock";

type Props = {
  name: string;
  subtitle?: string;
  captured: PieceType[];
  capturedColor: Color;
  seconds: number;
  active: boolean;
  /** Extra row under the card, for example the Resign and Offer draw buttons. */
  children?: ReactNode;
};

export function PlayerCard({
  name,
  subtitle,
  captured,
  capturedColor,
  seconds,
  active,
  children,
}: Props) {
  "use no memo";
  const pieceStyle = useTheme().pieceStyle;

  return (
    <View
      className={`mx-3 my-2 rounded-xl bg-bar px-3 py-2 ${
        active ? "border-2 border-accent" : "border-2 border-transparent"
      }`}
    >
      <View className="flex-row items-center">
        {/* TODO: replace the letter with the avatar picture. */}
        <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
          <Text className="text-lg font-bold text-ink">{name.charAt(0).toUpperCase()}</Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-ink" numberOfLines={1}>
            {name}
            {subtitle ? <Text className="font-normal opacity-60">{`  ${subtitle}`}</Text> : null}
          </Text>
          <View className="h-5 flex-row">
            {captured.map((type, i) => (
              <View key={i} style={{ marginRight: -6 }}>
                <PieceView piece={{ color: capturedColor, type }} size={20} styleId={pieceStyle} />
              </View>
            ))}
          </View>
        </View>

        <Text className="text-base font-bold text-ink">{formatClock(seconds)}</Text>
      </View>

      {children ? <View className="mt-2 flex-row justify-end">{children}</View> : null}
    </View>
  );
}