import type { ThemeId } from "@/core/storage/settings";
import type { PieceStyleId } from "./pieceStyles";

export type ThemeColors = {
  canvas: string;
  bar: string;
  ink: string;
  accent: string;
  danger: string;
  squareLight: string;
  squareDark: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  colors: ThemeColors;
  /** Piece set used until each theme gets its own art. */
  pieceStyle: PieceStyleId;
};

export const THEMES: Record<ThemeId, Theme> = {
  zen: {
    id: "zen",
    name: "Calm & Zen",
    tagline: "Soft and minimal",
    pieceStyle: "classic",
    colors: {
      canvas: "#C8D5C4",
      bar: "#F6F3EC",
      ink: "#2E3B2E",
      accent: "#CBAA6B",
      danger: "#A5382C",
      squareLight: "#F6F3EC",
      squareDark: "#8AA38A",
    },
  },
  cozy: {
    id: "cozy",
    name: "Cozy & Warm",
    tagline: "Wood and paper",
    pieceStyle: "gold-red",
    colors: {
      canvas: "#E9D8BC",
      bar: "#FAF3E3",
      ink: "#4A3426",
      accent: "#D08A4E",
      danger: "#A5382C",
      squareLight: "#F0DDB8",
      squareDark: "#B58863",
    },
  },
  playful: {
    id: "playful",
    name: "Playful & Fun",
    tagline: "Bouncy and colorful",
    pieceStyle: "gold-red",
    colors: {
      canvas: "#FFE08A",
      bar: "#FFFFFF",
      ink: "#3B2A5A",
      accent: "#FF8FB8",
      danger: "#E0402F",
      squareLight: "#FFF4D6",
      squareDark: "#7CCBFF",
    },
  },
  premium: {
    id: "premium",
    name: "Modern & Premium",
    tagline: "Sleek and refined",
    pieceStyle: "classic",
    colors: {
      canvas: "#DDE2EA",
      bar: "#F8F9FC",
      ink: "#1E2430",
      accent: "#B8C7E6",
      danger: "#C0392B",
      squareLight: "#F1F3F8",
      squareDark: "#8593AD",
    },
  },
  gadget: {
    id: "gadget",
    name: "Gadget Buddy",
    tagline: "Your robot friend",
    pieceStyle: "cream-moss",
    colors: {
      canvas: "#BFE3FA",
      bar: "#FFFFFF",
      ink: "#12355B",
      accent: "#FFC93C",
      danger: "#E4572E",
      squareLight: "#EAF6FF",
      squareDark: "#4DA3E0",
    },
  },
  ninja: {
    id: "ninja",
    name: "Little Ninja",
    tagline: "Quiet and quick",
    pieceStyle: "gold-green",
    colors: {
      canvas: "#D6D2C9",
      bar: "#F2EFE9",
      ink: "#262A33",
      accent: "#E37B6E",
      danger: "#B3261E",
      squareLight: "#E9E5DB",
      squareDark: "#7C8591",
    },
  },
};

/** "#C8D5C4" -> "200 213 196" (the format the CSS variables need). */
export function rgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}