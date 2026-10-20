import { useState } from "react";
import { Alert } from "react-native";

import { BOT_COUNT, getBot, type Bot } from "@/core/bots";
import type { Color } from "@/core/game";
import { adsRemoved, loadBeaten, markBeaten } from "@/core/storage";
import { CampaignScreen } from "@/ui/campaign/campaignScreen";
import { GameScreen } from "@/ui/game/gameScreen";

type Active = { level: number; bot: Bot; color: Color; round: number };

/** Your color against a bot. Random each game, like the Bluetooth games. */
const randomColor = (): Color => (Math.random() < 0.5 ? "w" : "b");

type Props = { onExit: () => void };

export function CampaignFlow({ onExit }: Props) {
  "use no memo";
  const [beaten, setBeaten] = useState<number[]>(() => loadBeaten());
  const [active, setActive] = useState<Active | null>(null);

  const start = (level: number) =>
    setActive({ level, bot: getBot(level), color: randomColor(), round: 1 });

  const handleResult = (level: number, result: "win" | "loss" | "draw") => {
    if (result !== "win") return;
    const next = markBeaten(beaten, level);
    setBeaten(next);
    if (!adsRemoved(beaten) && adsRemoved(next)) {
      Alert.alert("Boss defeated!", "Ads are now removed.");
    }
  };

  if (active) {
    return (
      <GameScreen
        key={`${active.level}-${active.round}`}
        localColor={active.color}
        bot={active.bot}
        onResult={(result) => handleResult(active.level, result)}
        onRematch={() =>
          setActive((a) => a && { ...a, color: randomColor(), round: a.round + 1 })
        }
        onNextBot={active.level < BOT_COUNT ? () => start(active.level + 1) : undefined}
        onLeave={() => setActive(null)}
      />
    );
  }

  return <CampaignScreen beaten={beaten} onPlay={start} onBack={onExit} />;
}