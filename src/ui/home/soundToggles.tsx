import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { feedback } from "@/core/feedback";
import { updateSettings, useSettings } from "@/core/storage/settings";
import { useTheme } from "@/ui/theme/useTheme";

const ICON = 22;
const BUTTON = "h-11 w-11 items-center justify-center rounded-full bg-bar";

const LAYER = { position: "absolute", left: 0, top: 0 } as const;

// ---- Sound: the two wave arcs fall away when sound is turned off -----------------------

const SPEAKER = "M4 9v6h4l5 5V4L8 9H4z";
const WAVE_INNER = "M15.5 8.5a5 5 0 0 1 0 7";
const WAVE_OUTER = "M18.5 5.5a9 9 0 0 1 0 13";

function WaveLayer({
  v,
  d,
  color,
  drop,
  tilt,
}: {
  v: Animated.Value; // 1 = in place, 0 = fallen
  d: string;
  color: string;
  drop: number;
  tilt: string;
}) {
  "use no memo";
  return (
    <Animated.View
      style={[
        LAYER,
        {
          opacity: v.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [drop, 0],
              }),
            },
            {
              rotate: v.interpolate({
                inputRange: [0, 1],
                outputRange: [tilt, "0deg"],
              }),
            },
          ],
        },
      ]}
    >
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
        <Path
          d={d}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

function SoundToggle() {
  "use no memo";
  const { soundEnabled } = useSettings();
  const ink = useTheme().colors.ink;
  const [inner] = useState(() => new Animated.Value(soundEnabled ? 1 : 0));
  const [outer] = useState(() => new Animated.Value(soundEnabled ? 1 : 0));

  // Follows the setting: the outer arc falls first, the inner one right after.
  useEffect(() => {
    const to = soundEnabled ? 1 : 0;
    const move = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: to,
        duration: to ? 280 : 340,
        delay,
        easing: to ? Easing.out(Easing.back(1.5)) : Easing.in(Easing.quad),
        useNativeDriver: true,
      });
    const anim = Animated.parallel([
      move(outer, to ? 80 : 0),
      move(inner, to ? 0 : 70),
    ]);
    anim.start();
    return () => anim.stop();
  }, [soundEnabled, inner, outer]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Sound"
      accessibilityState={{ checked: soundEnabled }}
      hitSlop={8}
      className={BUTTON}
      onPress={() => {
        const next = !soundEnabled;
        updateSettings({ soundEnabled: next });
        if (next) feedback.tap();
      }}
    >
      <View style={{ width: ICON, height: ICON }}>
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" style={LAYER}>
          <Path d={SPEAKER} fill={ink} />
        </Svg>
        <WaveLayer v={inner} d={WAVE_INNER} color={ink} drop={14} tilt="35deg" />
        <WaveLayer
          v={outer}
          d={WAVE_OUTER}
          color={ink}
          drop={16}
          tilt="-30deg"
        />
      </View>
    </Pressable>
  );
}

// ---- Vibration: the icon spins, then shows the "off" look -------------------------------

function VibrationToggle() {
  "use no memo";
  const { hapticsEnabled } = useSettings();
  const ink = useTheme().colors.ink;
  const [spin] = useState(() => new Animated.Value(0));
  const [spinning, setSpinning] = useState(false);
  const busy = useRef(false);

  useEffect(() => () => spin.stopAnimation(), [spin]);

  const onPress = () => {
    if (busy.current) return; // let the spin finish first
    busy.current = true;
    setSpinning(true);

    const next = !hapticsEnabled;
    updateSettings({ hapticsEnabled: next });
    if (next) feedback.tap();

    // Turning off: one turn clockwise, then it switches off.
    // Turning on: one turn back the other way, already switched on.
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: next ? -1 : 1,
      duration: next ? 380 : 520,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      busy.current = false;
      setSpinning(false);
    });
  };

  // While it spins the icon keeps the "on" look, so the switch-off happens after the spin.
  const glyphOn = spinning || hapticsEnabled;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Vibration"
      accessibilityState={{ checked: hapticsEnabled }}
      hitSlop={8}
      className={BUTTON}
      onPress={onPress}
    >
      <Animated.View
        style={{
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ["-360deg", "0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <MaterialCommunityIcons
          name={glyphOn ? "vibrate" : "vibrate-off"}
          size={ICON}
          color={ink}
        />
      </Animated.View>
    </Pressable>
  );
}

// ---- Mascot: the ghost rockets away, comes back from below, eyes open or closed ---------

function GhostToggle() {
  "use no memo";
  const { mascotEnabled } = useSettings();
  const { ink, bar } = useTheme().colors;
  const [fly] = useState(() => new Animated.Value(0));
  // null = follow the setting. During the animation it holds the face to show.
  const [shown, setShown] = useState<boolean | null>(null);
  const busy = useRef(false);

  useEffect(() => () => fly.stopAnimation(), [fly]);

  const open = shown ?? mascotEnabled;

  const onPress = () => {
    if (busy.current) return; // let the animation finish first
    busy.current = true;

    const next = !mascotEnabled;
    setShown(mascotEnabled); // keep the old face until the ghost is out of sight
    updateSettings({ mascotEnabled: next });
    if (next) feedback.tap();

    // 1. Shoot upward out of the button.
    Animated.timing(fly, {
      toValue: -1,
      duration: 190,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        busy.current = false;
        setShown(null);
        fly.setValue(0);
        return;
      }
      // 2. While hidden, change the eyes and move to below the button.
      setShown(next);
      fly.setValue(1);
      // 3. Rise back into place from below.
      Animated.timing(fly, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start(() => {
        busy.current = false;
        setShown(null);
      });
    });
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Mascot peeks"
      accessibilityState={{ checked: mascotEnabled }}
      hitSlop={8}
      className={`${BUTTON} overflow-hidden`}
      onPress={onPress}
    >
      <Animated.View
        style={{
          opacity: open ? 1 : 0.6,
          transform: [
            {
              translateY: fly.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-36, 0, 36],
              }),
            },
            {
              scaleY: fly.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [1.35, 1, 1.35],
              }),
            },
          ],
        }}
      >
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
          <Path
            d="M12 2a9 9 0 0 0-9 9v11l3-3 3 3 3-3 3 3 3-3 3 3V11a9 9 0 0 0-9-9z"
            fill={ink}
          />
          {open ? (
            <>
              <Circle cx={9} cy={10.5} r={1.7} fill={bar} />
              <Circle cx={15} cy={10.5} r={1.7} fill={bar} />
            </>
          ) : (
            <>
              <Path
                d="M7.3 10.5Q9 12.4 10.7 10.5"
                stroke={bar}
                strokeWidth={1.6}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M13.3 10.5Q15 12.4 16.7 10.5"
                stroke={bar}
                strokeWidth={1.6}
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

/** Small always-visible sound, vibration and mascot switches for the home screen. */
export function SoundToggles() {
  "use no memo";
  return (
    <View className="flex-row gap-2.5">
      <SoundToggle />
      <VibrationToggle />
      <GhostToggle />
    </View>
  );
}