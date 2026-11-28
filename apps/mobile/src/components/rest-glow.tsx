import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { REST_GLOW_MS } from "@/state/rest";

/**
 * A soft green light over the row of a set whose rest has just run out. It
 * lights up, fades away and leaves the row as it was.
 */
export function RestGlow() {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const step = (toValue: number, share: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: REST_GLOW_MS * share,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
    const animation = Animated.sequence([
      step(1, 0.2),
      Animated.delay(REST_GLOW_MS * 0.2),
      step(0, 0.6),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, { opacity }]} />
  );
}

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4ade80",
    backgroundColor: "#4ade8033",
    boxShadow: "0 0 16px 3px rgba(74, 222, 128, 0.6)",
  },
});
