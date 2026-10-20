import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  playerName: string;
  onFindPlayer: () => void;
  onPlayBot: () => void;
  onChangeName: () => void;
};

export function HomeScreen({ playerName, onFindPlayer, onPlayBot, onChangeName }: Props) {
  "use no memo";
  return (
    <SafeAreaView className="flex-1 bg-canvas px-6">
      <View className="flex-1 items-center justify-center">
        {/* TODO: replace this text with the logo image. */}
        <Text className="text-4xl font-bold text-ink">Easy Chess</Text>

        <Pressable onPress={onFindPlayer} className="mt-10 rounded-xl bg-accent px-8 py-4">
          <Text className="text-lg font-bold text-ink">Find player</Text>
        </Pressable>

        <Pressable onPress={onPlayBot} className="mt-4 rounded-xl bg-accent px-8 py-4">
          <Text className="text-lg font-bold text-ink">Play with a bot</Text>
        </Pressable>

        <Pressable onPress={onChangeName} className="mt-8">
          <Text className="text-ink">
            Playing as <Text className="font-bold">{playerName}</Text> · Change name
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}