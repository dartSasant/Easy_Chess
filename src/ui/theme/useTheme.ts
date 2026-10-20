import { useSettings } from "@/core/storage/settings";
import { THEMES, type Theme } from "./themes";

/** The current theme object (use `.colors.ink` etc. where a hex value is needed). */
export function useTheme(): Theme {
  const { themeId } = useSettings();
  return THEMES[themeId];
}