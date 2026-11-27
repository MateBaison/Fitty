import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { timeFormat } from "@fitty/core/domain/combat";
import { Button, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/**
 * The workout in progress at the top of the home screen, counting the time since
 * it started.
 */
export function ActiveWorkoutBanner({
  day,
  routine,
  started,
  onContinue,
}: {
  day: string;
  routine?: string;
  started: number;
  onContinue: () => void;
}) {
  const { t } = useAccount();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Number.isFinite(started)
    ? timeFormat((now - started) / 1000)
    : "--:--";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space(3),
        borderRadius: 24,
        borderColor: "#2b6a8f",
        borderStartWidth: 4,
        borderStartColor: colors.primary,
        borderWidth: 1,
        backgroundColor: "#10283a",
        padding: space(4),
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{
            color: colors.primary,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          ● {t("Entrenamiento en curso", "Workout in progress")}
        </Text>
        <Text
          style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}
        >
          {day}
        </Text>
        <Label muted>{routine}</Label>
      </View>
      <View style={{ minWidth: 112, gap: space(2) }}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`${t("Tiempo transcurrido", "Elapsed time")}: ${elapsed}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <SymbolView
            name={{ ios: "timer", android: "timer" }}
            tintColor={colors.primary}
            size={18}
          />
          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {elapsed}
          </Text>
        </View>
        <Button onPress={onContinue}>{t("Continuar", "Continue")}</Button>
      </View>
    </View>
  );
}
