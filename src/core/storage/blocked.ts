import Storage from "expo-sqlite/kv-store";

export type BlockedPlayer = { id: string; name: string };

const KEY = "blockedPlayers";

export function loadBlocked(): BlockedPlayer[] {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is BlockedPlayer =>
        !!p && typeof p.id === "string" && typeof p.name === "string",
    );
  } catch {
    return [];
  }
}

function save(list: BlockedPlayer[]): void {
  try {
    Storage.setItemSync(KEY, JSON.stringify(list));
  } catch {
    // Not saved. The block still counts until the app closes.
  }
}

/** Adds a player to the block list and returns the new list. */
export function blockPlayer(player: BlockedPlayer): BlockedPlayer[] {
  const current = loadBlocked();
  if (current.some((p) => p.id === player.id)) return current;
  const next = [...current, player];
  save(next);
  return next;
}

/** Removes a player from the block list and returns the new list. */
export function unblockPlayer(id: string): BlockedPlayer[] {
  const next = loadBlocked().filter((p) => p.id !== id);
  save(next);
  return next;
}