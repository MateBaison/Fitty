import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { timeFormat } from "@fitty/core/domain/combat";
import { BarDrawer } from "@/components/bar-drawer";
import { useAccount } from "@/state/account";
import { useRest } from "@/state/rest";
import { colors } from "@/theme";

/** The rest countdown above the bottom bar. */
export function RestDrawer() {
  const { t } = useAccount();
  const { rest, stop } = useRest();
  // Kept while it slides back down.
  const [last, setLast] = useState(rest);
  const [now, setNow] = useState(() => Date.now());
  if (rest && rest !== last) setLast(rest);
  useEffect(() => {
    if (!rest) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [rest]);
  const shown = rest ?? last;
  const left = shown
    ? timeFormat(Math.ceil(Math.max(0, shown.end - now) / 1000))
    : "";
  return (
    <BarDrawer open={Boolean(rest)}>
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
    </BarDrawer>
  );
}
