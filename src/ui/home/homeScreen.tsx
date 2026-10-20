import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { feedback, playStartupOnce } from "@/core/feedback";
import { BounceButton } from "@/ui/home/bounceButton";
import { FloatingPieces } from "@/ui/home/floatingPieces";
import { Mascot } from "@/ui/home/mascot";
import { SoundToggles } from "@/ui/home/soundToggles";
import { ThemePicker } from "@/ui/home/themePicker";

type Props = {
  playerName: string;
  onFindPlayer: () => void;
  onPlayBot: () => void;
  onChangeName: () => void;
};

export function HomeScreen({
  playerName,
  onFindPlayer,
  onPlayBot,
  onChangeName,
}: Props) {
  "use no memo";

  const [logo] = useState(() => new Animated.Value(0));
  const [buttons] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  // Startup sound plays once per app launch.
  useEffect(() => {
    playStartupOnce();

    // Logo pops in, then the buttons slide up one by one.
    Animated.sequence([
      Animated.spring(logo, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.stagger(
        140,
        buttons.map((v) =>
          Animated.spring(v, {
            toValue: 1,
            friction: 7,
            tension: 70,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [logo, buttons]);

  const slideUp = (v: Animated.Value) => ({
    opacity: v,
    transform: [
      {
        translateY: v.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }),
      },
    ],
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas px-6">
      <FloatingPieces />

      <View className="mt-2 flex-row justify-start">
        <SoundToggles />
      </View>

      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            opacity: logo,
            transform: [
              {
                scale: logo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          }}
        >
          {/* TODO: replace this text with the logo image. */}
          <Text className="text-4xl font-bold text-ink">Easy Chess</Text>
        </Animated.View>
        <Animated.View
          style={{ opacity: logo, marginTop: 16, alignItems: "center" }}
        >
          <Mascot />
        </Animated.View>

        <Animated.View style={slideUp(buttons[0])}>
          <BounceButton
            onPress={() => {
              feedback.nav();
              onFindPlayer();
            }}
            className="mt-10 rounded-xl bg-accent px-8 py-4"
          >
            <Text className="text-lg font-bold text-ink">Find player</Text>
          </BounceButton>
        </Animated.View>

        <Animated.View style={slideUp(buttons[1])}>
          <BounceButton
            onPress={() => {
              feedback.nav();
              onPlayBot();
            }}
            className="mt-4 rounded-xl bg-accent px-8 py-4"
          >
            <Text className="text-lg font-bold text-ink">Play with a bot</Text>
          </BounceButton>
        </Animated.View>

        <Animated.View style={slideUp(buttons[2])}>
          <Pressable
            onPress={() => {
              feedback.tap();
              onChangeName();
            }}
            className="mt-8"
          >
            <Text className="text-ink">
              Playing as <Text className="font-bold">{playerName}</Text> ·
              Change name
            </Text>
          </Pressable>

          <View className="mt-8">
            <ThemePicker />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
