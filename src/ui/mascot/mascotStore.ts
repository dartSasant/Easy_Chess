import { useEffect, useSyncExternalStore } from "react";

/**
 * Tiny shared store between the game screens and the mascot overlay.
 *  - "blockers": screens that must not be interrupted (a game in progress).
 *  - "peek requests": a screen asks the mascot to peek in with a specific line.
 */

// ---- blockers -------------------------------------------------------------

const blockers = new Set<string>();
const blockListeners = new Set<() => void>();
let blockedNow = false;

export function isMascotBlocked(): boolean {
  return blockedNow;
}

export function setMascotBlocked(key: string, on: boolean) {
  if (blockers.has(key) === on) return;
  if (on) blockers.add(key);
  else blockers.delete(key);
  blockedNow = blockers.size > 0;
  blockListeners.forEach((l) => l());
}

function subscribeBlocked(listener: () => void) {
  blockListeners.add(listener);
  return () => {
    blockListeners.delete(listener);
  };
}

/** True while any screen blocks the mascot. */
export function useMascotBlocked(): boolean {
  return useSyncExternalStore(subscribeBlocked, isMascotBlocked, isMascotBlocked);
}

/** Blocks the mascot while `active` is true and releases it when the screen goes away. */
export function useMascotBlockedWhile(active: boolean, key = "game") {
  useEffect(() => {
    setMascotBlocked(key, active);
    return () => setMascotBlocked(key, false);
  }, [active, key]);
}

// ---- peek requests ----------------------------------------------------------

export type PeekRequest = {
  /** What the mascot says. Leave out for a random line. */
  line?: string;
  /** Wait this long before peeking, e.g. so the win sound can play first. */
  delayMs?: number;
};

const PENDING_TTL_MS = 5000;
let pending: { line?: string; madeAt: number; readyAt: number } | null = null;
const requestListeners = new Set<() => void>();

/**
 * Ask the mascot to peek in. If the mascot is blocked or switched off right now, the request
 * waits a few seconds and is then dropped, so an old line never shows up later.
 */
export function requestMascotPeek(req: PeekRequest = {}) {
  const now = Date.now();
  pending = { line: req.line, madeAt: now, readyAt: now + (req.delayMs ?? 0) };
  requestListeners.forEach((l) => l());
}

/** Used by the mascot overlay. Returns how long to wait before showing, or null. */
export function takePendingPeek(): { line?: string; waitMs: number } | null {
  if (!pending) return null;
  const p = pending;
  pending = null;
  const now = Date.now();
  if (now - p.madeAt > PENDING_TTL_MS) return null;
  return { line: p.line, waitMs: Math.max(0, p.readyAt - now) };
}

export function onMascotPeekRequest(listener: () => void) {
  requestListeners.add(listener);
  return () => {
    requestListeners.delete(listener);
  };
}
