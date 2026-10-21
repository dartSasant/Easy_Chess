import { useState, type ReactNode } from "react";
import { Animated, Pressable, type PressableProps } from "react-native";

import { haptics } from "@/core/feedback";

type Props = Omit<PressableProps, "style" | "children"> & {
  className?: string;
  children: ReactNode;
  /** Soft tick when pressed down (default true). */
  haptic?: boolean;
};

/** A Pressable that squishes when pressed and springs back. */
export function BounceButton({
  children,
  className,
  onPressIn,
  onPressOut,
  haptic = true,
  ...rest
}: Props) {
  "use no memo";
  const [scale] = useState(() => new Animated.Value(1));

  const springTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        className={className}
        onPressIn={(e) => {
          springTo(0.92);
          if (haptic) haptics.press();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          springTo(1);
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
