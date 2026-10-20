import { useEffect, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";

import { feedback } from "@/core/feedback";

export type PopupAction = {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger" | "neutral";
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  actions: PopupAction[];
  /** Called when the backdrop is tapped or Android Back is pressed. Leave out to block both. */
  onClose?: () => void;
  /** Play the popup sound when it opens (default true). */
  sound?: boolean;
};

const TONE: Record<NonNullable<PopupAction["tone"]>, { box: string; text: string }> = {
  primary: { box: "bg-accent", text: "text-ink" },
  danger: { box: "border border-danger", text: "text-danger" },
  neutral: { box: "bg-canvas", text: "text-ink" },
};

export function GamePopup({ visible, title, message, actions, onClose, sound = true }: Props) {
  "use no memo";
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      return;
    }
    if (sound) feedback.popup();
    Animated.spring(slide, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, [visible, sound, slide]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-ink/60 px-8" onPress={onClose}>
        <Animated.View
          style={{
            opacity: slide,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }}
        >
          {/* The inner Pressable stops taps on the card from closing the popup. */}
          <Pressable className="w-full min-w-[260px] rounded-2xl bg-bar p-5">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            {message ? <Text className="mt-2 text-ink">{message}</Text> : null}
            <View className="mt-4 flex-row justify-end">
              {actions.map((a) => {
                const t = TONE[a.tone ?? "neutral"];
                return (
                  <Pressable
                    key={a.label}
                    onPress={a.onPress}
                    className={`ml-2 rounded-lg px-4 py-3 ${t.box}`}
                  >
                    <Text className={`font-bold ${t.text}`}>{a.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}