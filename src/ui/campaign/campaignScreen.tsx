import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BOSS_LEVEL, BOT_PROFILES } from "@/core/bots";
import { feedback } from "@/core/feedback";
import { adsRemoved, isUnlocked } from "@/core/storage";
import { BotPortrait } from "@/ui/campaign/botPortrait";
import { PullString } from "@/ui/common/pullString";

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
  const total = BOT_PROFILES.length;
  const beatenCount = BOT_PROFILES.filter((p) =>
    beaten.includes(p.level),
  ).length;
  const progress = total === 0 ? 0 : (beatenCount / total) * 100;

  // The first bot you can play that you have not beaten yet.
  const nextUp = BOT_PROFILES.find(
    (p) => isUnlocked(p.level, beaten) && !beaten.includes(p.level),
  )?.level;

  return (
    <SafeAreaView className="flex-1 bg-canvas px-4">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8 pt-14"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-extrabold text-ink">Play with a bot</Text>
        <Text className="mt-2 text-base leading-6 text-ink/70">
          {adsRemoved(beaten)
            ? "Ads removed."
            : `Beat ${boss.name} (bot ${BOSS_LEVEL}) to remove ads.`}
        </Text>

        <View className="mt-5 rounded-2xl bg-bar px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">Progress</Text>
            <Text className="text-sm font-bold text-ink">
              {beatenCount} / {total}
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
            <View
              className="h-2 rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap">
          {BOT_PROFILES.map((p) => {
            const unlocked = isUnlocked(p.level, beaten);
            const done = beaten.includes(p.level);
            const isBoss = p.level === BOSS_LEVEL;
            const isNext = p.level === nextUp;

            return (
              <View
                key={p.level}
                style={{ width: `${100 / COLUMNS}%` }}
                className="p-1"
              >
                <Pressable
                  disabled={!unlocked}
                  onPress={() => {
                    feedback.tap();
                    onPlay(p.level);
                  }}
                  className={`items-center rounded-2xl bg-bar p-1 ${
                    isBoss
                      ? "border-2 border-danger"
                      : isNext
                        ? "border-2 border-accent"
                        : "border border-ink/10"
                  } ${unlocked ? "" : "opacity-40"}`}
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: unlocked ? 0.12 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: unlocked ? 2 : 0,
                  }}
                >
                  <View className="aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-accent/20">
                    {/* Locked bots hold still and are greyed out by the opacity above. */}
                    <BotPortrait level={p.level} animate={unlocked} />

                    <View className="absolute left-1 top-1 rounded-full bg-bar px-1.5 py-0.5">
                      <Text className="text-[10px] font-extrabold text-ink">
                        {p.level}
                      </Text>
                    </View>

                    {!unlocked && <Text className="absolute text-lg">🔒</Text>}

                    {done && (
                      <View className="absolute bottom-1 right-1 rounded-full bg-accent px-1.5 py-0.5">
                        <Text className="text-[10px] font-extrabold text-ink">
                          ✓
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    numberOfLines={1}
                    className="mt-1 text-[11px] font-bold text-ink"
                  >
                    {p.name}
                  </Text>
                  {isBoss ? (
                    <View className="mb-0.5 mt-0.5 rounded-full bg-danger px-1.5">
                      <Text className="text-[9px] font-extrabold text-bar">
                        BOSS
                      </Text>
                    </View>
                  ) : (
                    <View className="h-1" />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <PullString onPull={onBack} />
    </SafeAreaView>
  );
}