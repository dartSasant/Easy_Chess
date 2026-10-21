import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { feedback } from "@/core/feedback";

const REST = 34; // string length when idle
const KNOB = 22; // knob size
const MAX_PULL = 120; // the string stretches at most this far
const TRIGGER = 70; // pull past this and letting go goes back
const LEFT = 20;

type Props = { onPull: () => void };

/** A string with a knob hanging from the top-left. Pull it down to go back. */
export function PullString({ onPull }: Props) {
  "use no memo";
  const insets = useSafeAreaInsets();
  const [pull] = useState(() => new Animated.Value(0));
  const onPullRef = useRef(onPull);
  const crossed = useRef(false);

  useEffect(() => {
    onPullRef.current = onPull;
  });

  const springBack = () =>
    Animated.spring(pull, {
      toValue: 0,
      friction: 4,
      tension: 140,
      useNativeDriver: false, // the string's height cannot use the native driver
    }).start();

  /* eslint-disable react-hooks/refs -- these refs are only read inside gesture handlers, never during render */
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pull.stopAnimation();
        crossed.current = false;
      },
      onPanResponderMove: (_, g) => {
        const d = Math.max(0, Math.min(MAX_PULL, g.dy));
        pull.setValue(d);
        // A small tick the moment the pull is enough to go back.
        if (d >= TRIGGER && !crossed.current) {
          crossed.current = true;
          feedback.tap();
        } else if (d < TRIGGER) {
          crossed.current = false;
        }
      },
      onPanResponderRelease: (_, g) => {
        const fired = g.dy >= TRIGGER || (g.vy > 1.2 && g.dy > 20);
        springBack();
        if (fired) {
          feedback.nav();
          onPullRef.current();
        }
      },
      onPanResponderTerminate: springBack,
    }),
  );
  /* eslint-enable react-hooks/refs */

  const height = pull.interpolate({
    inputRange: [0, MAX_PULL],
    outputRange: [REST, REST + MAX_PULL],
    extrapolate: "clamp",
  });

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Pull to go back"
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => onPullRef.current()}
      style={{
        position: "absolute",
        top: insets.top,
        left: LEFT,
        width: 44, // wider than the string so it is easy to grab
        alignItems: "center",
      }}
    >
      <Animated.View style={{ width: 2, height }}>
        <View className="flex-1 bg-ink" />
      </Animated.View>
      <View
        className="rounded-full bg-accent"
        style={{ width: KNOB, height: KNOB }}
      />
    </View>
  );
}
