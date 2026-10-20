import { useCallback, useEffect, useRef, useState } from "react";

import { pickLine, type LineCategory } from "@/core/bots/botLines";
import type { Color } from "@/core/game";
import type { Language } from "@/core/storage/settings";

export type Mood = "neutral" | "happy" | "sad";
export type Chat = { text: string; mood: Mood };
type Result = "win" | "loss" | "draw";

type Args = {
  level: number;
  enabled: boolean;
  moves: { color: Color; san: string }[];
  localColor: Color;
  outcome: Result | null;
  language: Language;
};

const SHOW_MS = 4500;

export function useBotChatter({ level, enabled, moves, localColor, outcome, language }: Args): Chat | null {
  const [chat, setChat] = useState<Chat | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdleAt = useRef(4);
  const handled = useRef(0);

  const plies = moves.length;
  const last = plies > 0 ? moves[plies - 1] : null;

  const say = useCallback(
    (category: LineCategory, mood: Mood, sticky = false) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setChat({ text: pickLine(level, category, language), mood });
      if (!sticky) hideTimer.current = setTimeout(() => setChat(null), SHOW_MS);
    },
    [level, language],
  );

  // Opening line.
  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(() => say("start", "neutral"), 700);
    return () => clearTimeout(id);
  }, [enabled, say]);

  // Reactions after each move, plus random chatter every few moves.
  useEffect(() => {
    if (!enabled || outcome || !last || plies === handled.current) return;
    handled.current = plies;

    const mine = last.color === localColor;
    const capture = last.san.includes("x");
    const check = last.san.includes("+");

    if (mine && (capture || check) && Math.random() < 0.7) {
      say("hurt", "sad");
    } else if (!mine && capture && Math.random() < 0.7) {
      say("hit", "happy");
    } else if (plies >= nextIdleAt.current) {
      say("idle", "neutral");
      nextIdleAt.current = plies + 3 + Math.floor(Math.random() * 4);
    }
  }, [enabled, outcome, last, plies, localColor, say]);

  // Closing line stays on screen.
  useEffect(() => {
    if (!enabled || !outcome) return;
    if (outcome === "win") say("botLoses", "sad", true);
    else if (outcome === "loss") say("botWins", "happy", true);
    else say("idle", "neutral");
  }, [enabled, outcome, say]);

  // Stop the hide timer when the screen closes.
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return chat;
}