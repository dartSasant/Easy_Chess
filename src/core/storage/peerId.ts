import Storage from "expo-sqlite/kv-store";

import { makePeerId } from "@/core/protocol";

const KEY = "peerId";

/** Same id on every launch, so "Block" still works after the app restarts. */
export function getStablePeerId(): string {
  try {
    const saved = Storage.getItemSync(KEY);
    if (saved && /^[0-9a-f]{16}$/.test(saved)) return saved;
    const id = makePeerId();
    Storage.setItemSync(KEY, id);
    return id;
  } catch {
    return makePeerId();
  }
}