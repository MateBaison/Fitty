import { usePathname, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BAR_HEIGHT, barOffset } from "@/components/bottom-space";
import { RestDrawer } from "@/components/rest-drawer";
import { WorkoutDrawer } from "@/components/workout-drawer";
import { useRTL } from "@/lib/direction";
import { useAccount } from "@/state/account";
import { colors } from "@/theme";

// Professionals is not functional yet: kept in the list but hidden from the bar.
// Set `hidden` to false to show it again (it sits on the left of Home).
const destinations: {
  href: "/professionals" | "/" | "/tools" | "/profile";
  es: string;
  en: string;
  icon: SymbolViewProps["name"];
  match: string[];
  hidden?: boolean;
}[] = [
  {
    href: "/tools",
    es: "Herramientas",
    en: "Tools",
    icon: { ios: "timer", android: "timer" },
    match: ["/tools", "/combat"],
  },
  {
    href: "/professionals",
    es: "Profesionales",
    en: "Professionals",
    icon: { ios: "person.2", android: "group" },
    match: ["/professionals"],
    hidden: true,
  },
  {
    href: "/",
    es: "Inicio",
    en: "Home",
    icon: { ios: "house", android: "home" },
    match: ["/", "/workout", "/library", "/progress", "/routines", "/body"],
  },
  {
    href: "/profile",
    es: "Perfil",
    en: "Profile",
    icon: { ios: "person", android: "person" },
    match: ["/profile"],
  },
];

const PADDING = 6;
const GAP = 4;
// The item height leaves the padding and the border inside the bar's height.
const ITEM = BAR_HEIGHT - 2 * PADDING - 2;

/**
 * Floating bottom navigation (Professionals hidden for now); Inicio also covers
 * Biblioteca, Progreso and workouts. The blue highlight slides to the new
 * section, and each item takes its color as the highlight reaches it.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rtl = useRTL();
  const { t } = useAccount();
  const items = destinations.filter((item) => !item.hidden);
  const active = items.findIndex((item) => item.match.includes(pathname));
  const [width, setWidth] = useState(0);
  const itemWidth = width
    ? (width - 2 * PADDING - 2 - GAP * (items.length - 1)) / items.length
    : 0;
  // Counted in items: 1.5 is halfway between the second and the third.
  const position = useRef(new Animated.Value(Math.max(active, 0))).current;
  useEffect(() => {
    if (active < 0) return;
    let current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!current) return;
      if (reduce) position.setValue(active);
      else
        Animated.spring(position, {
          toValue: active,
          stiffness: 210,
          damping: 24,
          mass: 1,
          useNativeDriver: true,
        }).start();
    });
    return () => {
      current = false;
    };
  }, [active, position]);
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        start: 0,
        end: 0,
        bottom: barOffset(insets.bottom),
        paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      {/* Drawn before the bar so that they come out from behind it. */}
      <RestDrawer />
      <WorkoutDrawer />
      <View
        accessibilityRole="tablist"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{
          width: "100%",
          maxWidth: 520,
          height: BAR_HEIGHT,
          flexDirection: "row",
          gap: GAP,
          padding: PADDING,
          borderRadius: BAR_HEIGHT / 2,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        {itemWidth && active >= 0 ? (
          <Animated.View
            // A new view on a direction change: the native driver would keep
            // the old offset until the next slide.
            key={rtl ? "rtl" : "ltr"}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: PADDING,
              start: PADDING,
              width: itemWidth,
              height: ITEM,
              borderRadius: ITEM / 2,
              backgroundColor: "#173a52",
              borderColor: "#2b6a8f",
              borderWidth: 1,
              transform: [
                {
                  translateX: Animated.multiply(
                    position,
                    (rtl ? -1 : 1) * (itemWidth + GAP),
                  ),
                },
              ],
            }}
          />
        ) : null}
        {items.map((item, index) => {
          // 1 while the highlight is on this item, 0 once it is a full item away.
          const lit =
            active < 0
              ? 0
              : position.interpolate({
                  inputRange: [index - 1, index, index + 1],
                  outputRange: [0, 1, 0],
                  extrapolate: "clamp",
                });
          const label = t(item.es, item.en);
          const face = (color: string) => (
            <>
              <SymbolView name={item.icon} tintColor={color} size={21} />
              <Text
                numberOfLines={1}
                style={{ color, fontSize: 10.5, fontWeight: "800" }}
              >
                {label}
              </Text>
            </>
          );
          return (
            <Pressable
              key={item.href}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: index === active }}
              onPress={() => router.navigate(item.href)}
              style={{ flex: 1, height: ITEM }}
            >
              <Animated.View
                style={[styles.face, { opacity: Animated.subtract(1, lit) }]}
              >
                {face(colors.muted)}
              </Animated.View>
              <Animated.View style={[styles.face, { opacity: lit }]}>
                {face(colors.primary)}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
});
