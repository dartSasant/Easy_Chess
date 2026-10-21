import { useState } from "react";
import { View } from "react-native";

import { loadPlayerName, savePlayerName } from "@/core/storage";
import { CampaignFlow } from "@/ui/campaign/campaignFlow";
import { HomeScreen } from "@/ui/home/homeScreen";
import { NameScreen } from "@/ui/home/nameScreen";
import { LobbyScreen } from "@/ui/lobby/lobbyScreen";
import { MascotHost } from "@/ui/mascot/mascotHost";
import { useMascotBlockedWhile } from "@/ui/mascot/mascotStore";

type Screen = "home" | "name" | "lobby" | "campaign";

export function AppFlow() {
  "use no memo";
  const [name, setName] = useState<string | null>(() => loadPlayerName());
  const [screen, setScreen] = useState<Screen>(name ? "home" : "name");

  // The mascot stays away while you type your name. Games block it themselves.
  const onNameScreen = screen === "name" || !name;
  useMascotBlockedWhile(onNameScreen, "name");

  let content;
  if (screen === "name" || !name) {
    content = (
      <NameScreen
        initial={name ?? ""}
        onSave={(value) => {
          savePlayerName(value);
          setName(value);
          setScreen("home");
        }}
        onCancel={name ? () => setScreen("home") : undefined}
      />
    );
  } else if (screen === "lobby") {
    content = <LobbyScreen playerName={name} onExit={() => setScreen("home")} />;
  } else if (screen === "campaign") {
    content = <CampaignFlow onExit={() => setScreen("home")} />;
  } else {
    content = (
      <HomeScreen
        playerName={name}
        onFindPlayer={() => setScreen("lobby")}
        onPlayBot={() => setScreen("campaign")}
        onChangeName={() => setScreen("name")}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {content}
      {/* One mascot above every screen. */}
      <MascotHost />
    </View>
  );
}
