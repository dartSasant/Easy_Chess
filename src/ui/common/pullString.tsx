import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { feedback, haptics } from "@/core/feedback";

const REST = 34; // default string length when idle
const KNOB = 22; // knob size
const MAX_PULL = 120; // the string stretches at most this far
const TRIGGER = 70; // pull past this and letting go goes back
const LEFT = 20;

type Props = {
  onPull: () => void;
  /** Drop in from above with a bounce when it first appears, then give a small hint tug. */
  entrance?: boolean;
  /** String length when idle. Shorter strings fit into a small space. */
  rest?: number;
};

/** A string with a knob hanging from the top-left. Pull it down to go back. */
export function PullString({ onPull, entrance = false, rest = REST }: Props) {
  "use no memo";
  const insets = useSafeAreaInsets();
  const [pull] = useState(() => new Animated.Value(0));
  const [enter] = useState(() => new Animated.Value(entrance ? 0 : 1)); // 0 above the screen, 1 hanging
  const onPullRef = useRef(onPull);
  const crossed = useRef(false);

  useEffect(() => {
    onPullRef.current = onPull;
  });

  // Entrance: drop in, bounce, then a small tug so people see it can be pulled.
  useEffect(() => {
    if (!entrance) return;
    let tug: Animated.CompositeAnimation | null = null;
    const drop = Animated.sequence([
      Animated.delay(250),
      Animated.spring(enter, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]);
    drop.start(({ finished }) => {
      if (!finished) return;
      haptics.tap();
      tug = Animated.sequence([
        Animated.timing(pull, { toValue: 16, duration: 180, useNativeDriver: false }),
        Animated.spring(pull, { toValue: 0, friction: 4, tension: 140, useNativeDriver: false }),
      ]);
      tug.start();
    });
    return () => {
      drop.stop();
      tug?.stop();
    };
  }, [entrance, enter, pull]);

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
    outputRange: [rest, rest + MAX_PULL],
    extrapolate: "clamp",
  });

  const dropY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [-(rest + KNOB + insets.top + 24), 0],
  });
  const fadeIn = enter.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
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
        opacity: fadeIn,
        transform: [{ translateY: dropY }],
      }}
    >
      <Animated.View style={{ width: 2, height }}>
        <View className="flex-1 bg-ink" />
      </Animated.View>
      <View className="rounded-full bg-accent" style={{ width: KNOB, height: KNOB }} />
    </Animated.View>
  );
}
