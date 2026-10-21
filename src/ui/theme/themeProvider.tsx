import { StatusBar } from "expo-status-bar";
import { vars } from "nativewind";
import { useMemo, type ReactNode } from "react";
import { View } from "react-native";

import { useSettings } from "@/core/storage/settings";
import { THEMES, rgbTriplet } from "./themes";

/** True when a "#RRGGBB" color is dark (so the status bar icons must be light). */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/** Wrap the whole app once. Changing the theme in settings re-colors everything inside. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeId } = useSettings();

  const style = useMemo(() => {
    const c = THEMES[themeId].colors;
    return vars({
      "--color-canvas": rgbTriplet(c.canvas),
      "--color-bar": rgbTriplet(c.bar),
      "--color-ink": rgbTriplet(c.ink),
      "--color-accent": rgbTriplet(c.accent),
      "--color-danger": rgbTriplet(c.danger),
      "--color-square-light": rgbTriplet(c.squareLight),
      "--color-square-dark": rgbTriplet(c.squareDark),
    });
  }, [themeId]);

  // Clock and battery icons follow the theme, not the phone's light / dark mode.
  const statusStyle = isDark(THEMES[themeId].colors.canvas) ? "light" : "dark";

  return (
    <View style={style} className="flex-1">
      <StatusBar style={statusStyle} />
      {children}
    </View>
  );
}
