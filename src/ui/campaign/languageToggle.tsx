import { Pressable, Text, View } from "react-native";

import { feedback } from "@/core/feedback";
import { updateSettings, useSettings, type Language } from "@/core/storage/settings";

const OPTIONS: { id: Language; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "ne", label: "नेपाली" },
];

/** Picks the language of the bot lines. */
export function LanguageToggle() {
  "use no memo";
  const { language } = useSettings();

  return (
    <View className="flex-row rounded-lg bg-bar p-1">
      {OPTIONS.map((o) => (
        <Pressable
          key={o.id}
          accessibilityRole="button"
          accessibilityState={{ selected: language === o.id }}
          onPress={() => {
            if (language === o.id) return;
            feedback.tap();
            updateSettings({ language: o.id });
          }}
          className={`rounded-md px-3 py-1 ${language === o.id ? "bg-accent" : ""}`}
        >
          <Text className="text-sm font-bold text-ink">{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}