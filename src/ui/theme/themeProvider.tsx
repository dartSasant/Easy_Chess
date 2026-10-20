import { vars } from "nativewind";
import { useMemo, type ReactNode } from "react";
import { View } from "react-native";

import { useSettings } from "@/core/storage/settings";
import { THEMES, rgbTriplet } from "./themes";

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

  return (
    <View style={style} className="flex-1">
      {children}
    </View>
  );
}