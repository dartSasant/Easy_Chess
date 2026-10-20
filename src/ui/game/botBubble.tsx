import { Text, View } from "react-native";

import { BotPortrait } from "@/ui/campaign/botPortrait";
import type { Chat } from "./useBotChatter";

const BADGE = { neutral: "", happy: "😂😂😂", sad: "😭" } as const;

export function BotBubble({ level, chat }: { level: number; chat: Chat }) {
  return (
    <View className="mx-3 flex-row items-center">
      <View>
        <View className="h-10 w-10 overflow-hidden rounded-full bg-bar">
          <BotPortrait level={level} animate={false} />
        </View>
        {chat.mood !== "neutral" && (
          <Text style={{ position: "absolute", right: -4, bottom: -4, fontSize: 16 }}>
            {BADGE[chat.mood]}
          </Text>
        )}
      </View>
      <View className="ml-3 flex-1 rounded-xl bg-bar px-3 py-2">
        <Text className="text-sm text-ink">{chat.text}</Text>
      </View>
    </View>
  );
}