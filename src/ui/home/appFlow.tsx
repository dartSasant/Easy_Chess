import { useState } from "react";

import { loadPlayerName, savePlayerName } from "@/storage"
import { HomeScreen } from "@/ui/home/homeScreen";
import { NameScreen } from "@/ui/home/nameScreen";
import { LobbyScreen } from "@/ui/lobby/lobbyScreen";

type Screen = "home" | "name" | "lobby";

export function AppFlow() {
  "use no memo";
  const [name, setName] = useState<string | null>(() => loadPlayerName());
  const [screen, setScreen] = useState<Screen>(name ? "home" : "name");

  if (screen === "name" || !name) {
    return (
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
  }

  if (screen === "lobby") {
    return <LobbyScreen playerName={name} onExit={() => setScreen("home")} />;
  }

  return (
    <HomeScreen
      playerName={name}
      onFindPlayer={() => setScreen("lobby")}
      onChangeName={() => setScreen("name")}
    />
  );
}