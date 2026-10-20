import Storage from "expo-sqlite/kv-store";

const KEY = "playerName";

export function loadPlayerName(): string | null {
  try {
    const value = Storage.getItemSync(KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

export function savePlayerName(name: string): void {
  try {
    Storage.setItemSync(KEY, name.trim().slice(0, 24));
  } catch {
    // Not saved. The name still works until the app closes.
  }
}