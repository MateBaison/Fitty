import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import { BAR_HEIGHT, DRAWER_HEIGHT } from "@/components/bottom-space";

// The lower part of the panel stays hidden behind what is drawn after it.
const BEHIND = BAR_HEIGHT / 2;

/**
 * A panel that slides up from behind the bottom bar, which must be drawn after
 * it. Drawers drawn one after another stack above the bar.
 */
export function BarDrawer({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  // Stays mounted while it slides back down.
  const [mounted, setMounted] = useState(open);
  const slide = useRef(new Animated.Value(0)).current;
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    let current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!current) return;
      Animated.timing(slide, {
        toValue: open ? 1 : 0,
        duration: reduce ? 0 : 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !open) setMounted(false);
      });
    });
    return () => {
      current = false;
    };
  }, [open, slide]);
  if (!mounted) return null;
  return (
    <View
      pointerEvents={open ? "box-none" : "none"}
      style={{
        width: "100%",
        maxWidth: 520,
        height: DRAWER_HEIGHT + BEHIND,
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
                outputRange: [DRAWER_HEIGHT, 0],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            height: DRAWER_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingStart: 16,
            paddingEnd: 8,
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
