import { createContext, use, type ReactNode } from "react";
import {
  I18nManager,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { textDirection } from "@fitty/core/data/translations";

// The account language decides the direction, not the phone's: without this an
// Arabic phone would mirror the native side too (takes effect from the next launch).
I18nManager.allowRTL(false);

const RightToLeft = createContext(false);

/**
 * Lays its content out in the language's reading direction. Every view and modal
 * below inherits it and it changes live, with no restart. Styles that depend on a
 * side must use start/end (marginStart, borderStartWidth, `start: 0`).
 */
export function Direction({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  const direction = textDirection(language);
  return (
    <RightToLeft value={direction === "rtl"}>
      <View style={{ flex: 1, direction }}>{children}</View>
    </RightToLeft>
  );
}

/** For what the layout cannot mirror by itself: arrows, gestures and drawn controls. */
export function useRTL() {
  return use(RightToLeft);
}

/** Text fields do not follow the direction around them: style for those aligned to a side. */
export function useInputAlign() {
  return useRTL() ? ({ textAlign: "right" } as const) : null;
}

/** Keeps a measurement such as "90 kg × 8 reps" in order inside right-to-left text. */
export function leftToRight(text: string) {
  return `\u2066${text}\u2069`;
}

/** Keeps a piece of text in its own direction, such as an Arabic date after a Latin name. */
export function isolate(text: string) {
  return `\u2068${text}\u2069`;
}

/** "‹" or "›" pointing back (to the previous item) or forward in the reading direction. */
export function Chevron({
  to,
  style,
}: {
  to: "back" | "forward";
  style?: StyleProp<TextStyle>;
}) {
  const pointsLeft = (to === "back") !== useRTL();
  // A fixed writing direction stops the text engine from mirroring the glyph again.
  return (
    <Text style={[style, { writingDirection: "ltr" }]}>
      {pointsLeft ? "‹" : "›"}
    </Text>
  );
}
