import { router, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SupportForm } from "@/components/support-form";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Same header as the web: logo, date and time, support and sign out, with the section title underneath. */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const locale = snapshot.settings.language ?? "es";
  const [now, setNow] = useState(() => new Date());
  const [support, setSupport] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const title =
    pathname.startsWith("/professionals")
      ? t("Profesionales", "Professionals")
      : pathname.startsWith("/library")
        ? t("Biblioteca", "Library")
        : pathname.startsWith("/progress")
          ? t("Progreso", "Progress")
          : pathname.startsWith("/tools")
            ? t("Herramientas", "Tools")
            : pathname.startsWith("/profile")
              ? t("Perfil", "Profile")
              : pathname.startsWith("/workout")
                ? t("Entrenamiento", "Workout")
                : t("Inicio", "Home");
  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 18),
        paddingHorizontal: space(4),
        paddingBottom: space(3),
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Ir al inicio", "Go home")}
          onPress={() => router.navigate("/")}
          hitSlop={8}
          style={{ gap: 2, alignItems: "center" }}
        >
          <Image
            source={require("@/assets/images/fitty-wordmark.png")}
            style={{ width: 62, height: 30 }}
            resizeMode="contain"
            accessibilityLabel="Fitty"
          />
          <Text
            style={{
              color: colors.muted,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 1.4,
            }}
          >
            GYM TRACKER
          </Text>
        </Pressable>
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={{
          color: colors.foreground,
          fontSize: 16,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {now.toLocaleDateString(locale, { day: "numeric", month: "short" })}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {now.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Soporte", "Support")}
          onPress={() => setSupport(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <SymbolView
            name={{ ios: "headphones", android: "support_agent" }}
            tintColor={colors.foreground}
            size={20}
          />
        </Pressable>
      </View>
      <SupportForm visible={support} onClose={() => setSupport(false)} />
    </View>
  );
}
