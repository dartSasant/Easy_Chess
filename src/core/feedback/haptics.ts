import * as Haptics from "expo-haptics";

import { getSettings } from "../storage/settings";

function run(fn: () => Promise<void> | void) {
  if (!getSettings().hapticsEnabled) return;
  try {
    const r = fn();
    if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(() => {});
  } catch {
    // devices without haptics: fail silently
  }
}

export const haptics = {
  tap: () => run(() => Haptics.selectionAsync()),
  move: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  capture: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  check: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Strong triple pulse for an incoming challenge. */
  challenge: () => {
    if (!getSettings().hapticsEnabled) return;
    let n = 0;
    const fire = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    fire();
    const id = setInterval(() => {
      fire();
      if (++n >= 2) clearInterval(id);
    }, 150);
  },
};