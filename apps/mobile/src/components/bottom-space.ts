import { createContext } from "react";
import { Platform } from "react-native";

/** Height of the floating bottom bar itself. */
export const BAR_HEIGHT = 71;

/** Distance from the bottom edge: close to an iPhone's home line, above Android's buttons. */
export function barOffset(inset: number) {
  return Platform.OS === "ios" ? Math.max(inset - 10, 12) : inset + 10;
}

/** Room scrolling screens leave at their end so the bar covers nothing. */
export const BottomSpace = createContext(0);
