import { Pressable, Text, View } from "react-native";

import { playStartup } from "@/core/feedback";
import {
  THEME_IDS,
  updateSettings,
  useSettings,
} from "@/core/storage/settings";
import { THEMES } from "@/ui/theme/themes";

export function ThemePicker() {
  "use no memo";
  const { themeId } = useSettings();

  return (
    <View className="w-full">
      <Text className="mb-2 text-center font-bold text-ink">Themes</Text>
      <View className="flex-row flex-wrap justify-center gap-3 px-1">
        {THEME_IDS.map((id) => {
          const t = THEMES[id];
          const selected = id === themeId;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.name} theme`}
              onPress={() => {
                if (selected) return;
                updateSettings({ themeId: id });
                playStartup(id);
              }}
              className={`w-[30%] items-center rounded-xl bg-bar px-3 py-2 ${
                selected ? "border-2 border-ink" : "border-2 border-transparent"
              }`}
            >
              {/* Swatch drawn in the theme's own colors, whichever theme is active. */}
              <View className="flex-row overflow-hidden rounded-md">
                <View
                  style={{
                    width: 18,
                    height: 22,
                    backgroundColor: t.colors.canvas,
                  }}
                />
                <View
                  style={{
                    width: 18,
                    height: 22,
                    backgroundColor: t.colors.accent,
                  }}
                />
                <View
                  style={{
                    width: 18,
                    height: 22,
                    backgroundColor: t.colors.squareDark,
                  }}
                />
              </View>
              <Text
                className="mt-1 text-xs font-bold text-ink"
                numberOfLines={1}
              >
                {t.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
