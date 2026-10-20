import type { ImageSourcePropType } from "react-native";

/**
 * Bot pictures. Put square PNGs in assets/bots/ and uncomment the matching line.
 * A bot without a picture shows a chess piece instead.
 */
export const BOT_IMAGES: Record<number, ImageSourcePropType | undefined> = {
  1: require("../../../assets/bots/bot-01.png"),
  2: require("../../../assets/bots/bot-02.png"),
  3: require("../../../assets/bots/bot-03.png"),
  4: require("../../../assets/bots/bot-04.png"),
  5: require("../../../assets/bots/bot-05.png"),
  6: require("../../../assets/bots/bot-06.png"),
  7: require("../../../assets/bots/bot-07.png"),
  8: require("../../../assets/bots/bot-08.png"),
  9: require("../../../assets/bots/bot-09.png"),
  10: require("../../../assets/bots/bot-10.png"),
  11: require("../../../assets/bots/bot-11.png"),
  12: require("../../../assets/bots/bot-12.png"),
  13: require("../../../assets/bots/bot-13.png"),
  14: require("../../../assets/bots/bot-14.png"),
  15: require("../../../assets/bots/bot-15.png"),
};