import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BOSS_LEVEL, BOT_PROFILES } from "@/core/bots";
import { adsRemoved, isUnlocked } from "@/core/storage";
import { BotPortrait } from "@/ui/campaign/botPortrait";
import { LanguageToggle } from "@/ui/campaign/languageToggle";

/** Bots per row. 5 per row gives 3 rows for 15 bots. */
const COLUMNS = 5;

type Props = {
  beaten: number[];
  onPlay: (level: number) => void;
  onBack: () => void;
};

export function CampaignScreen({ beaten, onPlay, onBack }: Props) {
  "use no memo";
  const boss = BOT_PROFILES[BOSS_LEVEL - 1];

  return (
    <SafeAreaView className="flex-1 bg-canvas px-2">
      <View className="mt-4 flex-row items-center justify-between">
        <Pressable onPress={onBack} className="rounded-lg bg-bar px-3 py-2">
          <Text className="font-bold text-ink">Back</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text className="mt-4 text-xl font-bold text-ink">Play with a bot</Text>
      <Text className="mt-1 text-ink">
        {adsRemoved(beaten)
          ? "Ads removed."
          : `Beat ${boss.name} (bot ${BOSS_LEVEL}) to remove ads.`}
      </Text>

      <ScrollView className="mt-3 flex-1">
        <View className="flex-row flex-wrap">
          {BOT_PROFILES.map((p) => {
            const unlocked = isUnlocked(p.level, beaten);
            const done = beaten.includes(p.level);
            const isBoss = p.level === BOSS_LEVEL;

            return (
              <View key={p.level} style={{ width: `${100 / COLUMNS}%` }} className="p-0.5">
                <Pressable
                  disabled={!unlocked}
                  onPress={() => onPlay(p.level)}
                  className={`items-center rounded-lg bg-bar p-1 ${
                    isBoss ? "border-2 border-danger" : ""
                  } ${unlocked ? "" : "opacity-40"}`}
                >
                  <View className="aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-canvas">
                    {/* Locked bots hold still and are greyed out by the opacity above. */}
                    <BotPortrait level={p.level} animate={unlocked} />

                    <View className="absolute left-0.5 top-0.5 rounded-full bg-bar px-1">
                      <Text className="text-[10px] font-bold text-ink">{p.level}</Text>
                    </View>

                    {!unlocked && <Text className="absolute text-lg">🔒</Text>}

                    {done && (
                      <View className="absolute bottom-0.5 right-0.5 rounded-full bg-accent px-1">
                        <Text className="text-[10px] font-bold text-ink">✓</Text>
                      </View>
                    )}
                  </View>

                  <Text numberOfLines={1} className="mt-1 text-xs font-bold text-ink">
                    {p.name}
                  </Text>
                  {isBoss && <Text className="text-[10px] font-bold text-danger">BOSS</Text>}
                </Pressable>
              </View>
            );
          })}
        </View>
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}