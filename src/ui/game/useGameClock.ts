import { useEffect, useState } from "react";

import type { Color } from "@/core/game";

/** Elapsed seconds per player. The clock of the side to move ticks; nothing counts down. */
export function useGameClock(turn: Color, running: boolean) {
  const [seconds, setSeconds] = useState({ w: 0, b: 0 });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => ({ ...s, [turn]: s[turn] + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [turn, running]);

  return seconds;
}

/** 75 -> "1:15", 3700 -> "1:01:40" */
export function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}