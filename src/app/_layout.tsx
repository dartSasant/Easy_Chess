import { Stack } from "expo-router";
import { useEffect } from "react";

import "../global.css";
import { initAudio } from "@/core/feedback";
import { ThemeProvider } from "@/ui/theme/themeProvider";

export default function RootLayout() {
  useEffect(() => {
    void initAudio();
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}