import * as Haptics from "expo-haptics";

import { getSettings } from "../storage/settings";

type Style = Haptics.ImpactFeedbackStyle;
const S = Haptics.ImpactFeedbackStyle;

function run(fn: () => Promise<void> | void) {
  if (!getSettings().hapticsEnabled) return;
  try {
    const r = fn();
    if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(() => {});
  } catch {
    // devices without haptics: fail silently
  }
}

const impact = (style: Style) => run(() => Haptics.impactAsync(style));

/** Several impacts in a row. `at` is the delay in ms from now. */
function pattern(...steps: { style: Style; at: number }[]) {
  if (!getSettings().hapticsEnabled) return;
  for (const step of steps) {
    if (step.at <= 0) impact(step.style);
    else setTimeout(() => impact(step.style), step.at);
  }
}

export const haptics = {
  // --- game ---
  tap: () => run(() => Haptics.selectionAsync()),
  move: () => run(() => Haptics.impactAsync(S.Light)),
  capture: () => run(() => Haptics.impactAsync(S.Medium)),
  check: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** The opponent's move arrived and it is your turn: light, then a bit firmer. */
  turn: () => pattern({ style: S.Light, at: 0 }, { style: S.Medium, at: 110 }),
  /** A new game opens. */
  start: () => pattern({ style: S.Medium, at: 0 }, { style: S.Light, at: 130 }),

  // --- menus and buttons ---
  /** Very soft tick when a button goes down. The release tick comes from feedback.tap/nav. */
  press: () => impact(S.Soft),
  /** Popups: noticeable but not harsh. */
  popup: () => impact(S.Medium),
  /** Picking a theme: a crisp click. */
  pick: () => impact(S.Rigid),

  // --- mascot ---
  /** The mascot slides in: a quick tip-tap. */
  peek: () => pattern({ style: S.Soft, at: 0 }, { style: S.Light, at: 110 }),
  /** Tapping the mascot, opening or closing the theme menu. */
  pop: () => impact(S.Medium),
  /** A bot speech bubble appears. */
  bubble: () => impact(S.Soft),

  // --- nearby players ---
  /** A new phone shows up on the radar: a double ping. */
  radar: () => pattern({ style: S.Soft, at: 0 }, { style: S.Soft, at: 120 }),
  /** Strong triple pulse for an incoming challenge. */
  challenge: () => {
    if (!getSettings().hapticsEnabled) return;
    let n = 0;
    const fire = () => run(() => Haptics.impactAsync(S.Heavy));
    fire();
    const id = setInterval(() => {
      fire();
      if (++n >= 2) clearInterval(id);
    }, 150);
  },
};
