import { useState } from "react";
import { Alert } from "react-native";

import { BOSS_COUNT, BOT_COUNT, getBossBot, getBot, type Bot } from "@/core/bots";
import type { Color } from "@/core/game";
import {
  adsRemoved,
  loadBeaten,
  loadBossBeaten,
  markBeaten,
  markBossBeaten,
} from "@/core/storage";
import { CampaignScreen } from "@/ui/campaign/campaignScreen";
import { GameScreen } from "@/ui/game/gameScreen";

type Active = { level: number; bot: Bot; color: Color; round: number; boss?: number };

/** Your color against a bot. Random each game, like the Bluetooth games. */
const randomColor = (): Color => (Math.random() < 0.5 ? "w" : "b");

type Props = { onExit: () => void };

export function CampaignFlow({ onExit }: Props) {
  "use no memo";
  const [beaten, setBeaten] = useState<number[]>(() => loadBeaten());
  const [bossBeaten, setBossBeaten] = useState<number[]>(() => loadBossBeaten());
  const [active, setActive] = useState<Active | null>(null);

  const start = (level: number) =>
    setActive({ level, bot: getBot(level), color: randomColor(), round: 1 });

  const startBoss = (index: number) =>
    setActive({
      level: 100 + index,
      bot: getBossBot(index),
      color: randomColor(),
      round: 1,
      boss: index,
    });

  const handleResult = (a: Active, result: "win" | "loss" | "draw") => {
    if (result !== "win") return;
    if (a.boss) {
      const next = markBossBeaten(bossBeaten, a.boss);
      setBossBeaten(next);
      if (a.boss < BOSS_COUNT && !bossBeaten.includes(a.boss)) {
        Alert.alert("Boss defeated!", "A new boss mascot is unlocked.");
      }
      return;
    }
    const next = markBeaten(beaten, a.level);
    setBeaten(next);
    if (!adsRemoved(beaten) && adsRemoved(next)) {
      Alert.alert("Boss defeated!", "Ads are now removed.");
    }
  };

  if (active) {
    const nextBot = active.boss
      ? active.boss < BOSS_COUNT
        ? () => startBoss(active.boss! + 1)
        : undefined
      : active.level < BOT_COUNT
        ? () => start(active.level + 1)
        : undefined;
    return (
      <GameScreen
        key={`${active.level}-${active.round}`}
        localColor={active.color}
        bot={active.bot}
        onResult={(result) => handleResult(active, result)}
        onRematch={() =>
          setActive(
            (a) => a && { ...a, color: randomColor(), round: a.round + 1 },
          )
        }
        onNextBot={nextBot}
        onLeave={() => setActive(null)}
      />
    );
  }

  return (
    <CampaignScreen
      beaten={beaten}
      bossBeaten={bossBeaten}
      onPlay={start}
      onPlayBoss={startBoss}
      onBack={onExit}
    />
  );
}
