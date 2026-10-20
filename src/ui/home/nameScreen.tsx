import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  initial?: string;
  onSave: (name: string) => void;
  /** Only given when a name already exists, so the player can back out. */
  onCancel?: () => void;
};

export function NameScreen({ initial = "", onSave, onCancel }: Props) {
  "use no memo";
  const [text, setText] = useState(initial);
  const trimmed = text.trim();

  return (
    <SafeAreaView className="flex-1 bg-canvas px-6">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-ink">What should we call you?</Text>
        <Text className="mt-2 text-ink">
          Your opponent will see this name. You can change it later.
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          maxLength={24}
          autoFocus
          autoCorrect={false}
          placeholder="Your name"
          returnKeyType="done"
          onSubmitEditing={() => {
            if (trimmed) onSave(trimmed);
          }}
          className="mt-4 rounded-lg bg-bar px-4 py-3 text-base text-ink"
        />

        <View className="mt-4 flex-row">
          <Pressable
            onPress={() => onSave(trimmed)}
            disabled={!trimmed}
            className={`mr-2 rounded-lg px-4 py-3 ${trimmed ? "bg-accent" : "bg-bar"}`}
          >
            <Text className="font-bold text-ink">Save</Text>
          </Pressable>
          {onCancel && (
            <Pressable onPress={onCancel} className="rounded-lg bg-bar px-4 py-3">
              <Text className="font-bold text-ink">Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}