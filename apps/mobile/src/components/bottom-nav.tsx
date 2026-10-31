import { usePathname, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccount } from "@/state/account";
import { colors } from "@/theme";

const destinations: {
  href: "/professionals" | "/" | "/tools" | "/profile";
  es: string;
  en: string;
  icon: SymbolViewProps["name"];
  match: string[];
}[] = [
  {
    href: "/professionals",
    es: "Profesionales",
    en: "Professionals",
    icon: { ios: "person.2", android: "group" },
    match: ["/professionals"],
  },
  {
    href: "/",
    es: "Inicio",
    en: "Home",
    icon: { ios: "house", android: "home" },
    match: ["/", "/workout", "/library", "/progress", "/routines", "/body"],
  },
  {
    href: "/tools",
    es: "Herramientas",
    en: "Tools",
    icon: { ios: "timer", android: "timer" },
    match: ["/tools", "/tracking", "/combat"],
  },
  {
    href: "/profile",
    es: "Perfil",
    en: "Profile",
    icon: { ios: "person", android: "person" },
    match: ["/profile"],
  },
];

/** Same four destinations as the web bottom navigation; Inicio also covers Biblioteca, Progreso and workouts. */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useAccount();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        gap: 4,
      }}
    >
      {destinations.map((item) => {
        const active = item.match.includes(pathname);
        return (
          <Pressable
            key={item.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(item.href)}
            style={{
              flex: 1,
              minHeight: 57,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: active ? "#173a52" : "transparent",
              borderColor: active ? "#2b6a8f" : "transparent",
              borderWidth: 1,
            }}
          >
            <SymbolView
              name={item.icon}
              tintColor={active ? colors.primary : colors.muted}
              size={21}
            />
            <Text
              numberOfLines={1}
              style={{
                color: active ? colors.primary : colors.muted,
                fontSize: 10.5,
                fontWeight: "800",
              }}
            >
              {t(item.es, item.en)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
