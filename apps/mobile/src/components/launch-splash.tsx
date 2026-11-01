import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

/** Same intro as the web: isotype arrives, wordmark follows, then it fades out. */
export function LaunchSplash() {
  const [visible, setVisible] = useState(true);
  const logo = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logo, {
        toValue: 1,
        duration: 1050,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(word, {
        toValue: 1,
        duration: 800,
        delay: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 250,
        delay: 1250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [logo, word, fade]);
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.root, { opacity: fade }]}
    >
      <View style={styles.brand}>
        <Animated.View
          style={{
            opacity: logo,
            transform: [
              { translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              { scale: logo.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 1.025, 1] }) },
            ],
          }}
        >
          <Image
            source={require("@/assets/images/launch-isotype.png")}
            style={styles.isotype}
          />
        </Animated.View>
        <Animated.View
          style={{
            opacity: word,
            transform: [
              { translateY: word.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            ],
          }}
        >
          <Image
            source={require("@/assets/images/launch-wordmark.png")}
            style={styles.wordmark}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#052e4f",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { alignItems: "center", gap: 12 },
  isotype: { width: 220, height: 220 },
  wordmark: { width: 180, height: 85 },
});
