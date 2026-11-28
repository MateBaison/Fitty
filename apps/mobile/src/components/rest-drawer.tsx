import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";
import { timeFormat } from "@fitty/core/domain/combat";
import { BAR_HEIGHT, REST_HEIGHT } from "@/components/bottom-space";
import { useAccount } from "@/state/account";
import { useRest } from "@/state/rest";
import { colors } from "@/theme";

// The lower part of the panel stays hidden behind the bar.
const BEHIND = BAR_HEIGHT / 2;

/**
 * The rest countdown: it slides up from behind the bottom bar, which must be
 * drawn right after it.
 */
export function RestDrawer() {
  const { t } = useAccount();
  const { rest, stop } = useRest();
  // Kept while it slides back down.
  const [last, setLast] = useState(rest);
  const [now, setNow] = useState(() => Date.now());
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rest) setLast(rest);
    let current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!current) return;
      Animated.timing(slide, {
        toValue: rest ? 1 : 0,
        duration: reduce ? 0 : 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !rest) setLast(null);
      });
    });
    return () => {
      current = false;
    };
  }, [rest, slide]);
  useEffect(() => {
    if (!rest) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [rest]);
  const shown = rest ?? last;
  if (!shown) return null;
  const left = timeFormat(Math.ceil(Math.max(0, shown.end - now) / 1000));
  return (
    <View
      pointerEvents={rest ? "box-none" : "none"}
      style={{
        width: "100%",
        maxWidth: 520,
        height: REST_HEIGHT + BEHIND,
        marginBottom: -BEHIND,
        // Clear of the rounded ends of the bar.
        paddingHorizontal: BEHIND,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: "#2b6a8f",
          backgroundColor: "#173a52",
          transform: [
            {
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [REST_HEIGHT, 0],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            height: REST_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingStart: 16,
            paddingEnd: 8,
          }}
        >
          <SymbolView
            name={{ ios: "timer", android: "timer" }}
            tintColor={colors.primary}
            size={20}
          />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.foreground,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {t("Descanso", "Rest")}
          </Text>
          <Text
            accessibilityRole="timer"
            style={{
              color: colors.foreground,
              fontSize: 22,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {left}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Omitir descanso", "Skip rest")}
            onPress={stop}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={{ ios: "forward.end.fill", android: "skip_next" }}
              tintColor={colors.primaryForeground}
              size={18}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
