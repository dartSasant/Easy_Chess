import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { feedback } from "@/core/feedback";
import { updateSettings, useSettings } from "@/core/storage/settings";
import { useTheme } from "@/ui/theme/useTheme";

/** Small always-visible sound, vibration and mascot switches for the home screen. */
export function SoundToggles() {
  "use no memo";
  const { soundEnabled, hapticsEnabled, mascotEnabled } = useSettings();
  const ink = useTheme().colors.ink;

  return (
    <View className="flex-row gap-2.5">
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Sound"
        accessibilityState={{ checked: soundEnabled }}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-bar"
        onPress={() => {
          const next = !soundEnabled;
          updateSettings({ soundEnabled: next });
          if (next) feedback.tap();
        }}
      >
        <MaterialCommunityIcons
          name={soundEnabled ? "volume-high" : "volume-off"}
          size={22}
          color={ink}
        />
      </Pressable>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Vibration"
        accessibilityState={{ checked: hapticsEnabled }}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-bar"
        onPress={() => {
          const next = !hapticsEnabled;
          updateSettings({ hapticsEnabled: next });
          if (next) feedback.tap();
        }}
      >
        <MaterialCommunityIcons
          name={hapticsEnabled ? "vibrate" : "vibrate-off"}
          size={22}
          color={ink}
        />
      </Pressable>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Mascot peeks"
        accessibilityState={{ checked: mascotEnabled }}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-bar"
        onPress={() => {
          const next = !mascotEnabled;
          updateSettings({ mascotEnabled: next });
          if (next) feedback.tap();
        }}
      >
        <MaterialCommunityIcons
          name={mascotEnabled ? "ghost" : "ghost-off"}
          size={22}
          color={ink}
        />
      </Pressable>
    </View>
  );
}
