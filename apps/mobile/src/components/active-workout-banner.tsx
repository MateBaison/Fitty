import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { timeFormat } from "@fitty/core/domain/combat";
import { Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

function RoundButton({
  label,
  icon,
  color,
  tint,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  color: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 48,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <SymbolView name={icon} tintColor={tint} size={20} weight="bold" />
    </Pressable>
  );
}

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
  const { change, t } = useAccount();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Number.isFinite(started)
    ? timeFormat((now - started) / 1000)
    : "--:--";
  const cancel = () =>
    Alert.alert(
      t("Cancelar entrenamiento", "Cancel workout"),
      t("No se guardará este entrenamiento.", "This workout won't be saved."),
      [
        { text: t("Volver", "Back"), style: "cancel" },
        {
          text: t("Cancelar entrenamiento", "Cancel workout"),
          style: "destructive",
          onPress: () => void change((draft) => void (draft.workout = null)),
        },
      ],
    );
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
      <View style={{ alignItems: "center", gap: space(2) }}>
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
        <View style={{ flexDirection: "row", gap: space(2) }}>
          <RoundButton
            label={t("Cancelar entrenamiento", "Cancel workout")}
            icon={{ ios: "xmark", android: "close" }}
            color={colors.destructive}
            tint="#ffffff"
            onPress={cancel}
          />
          <RoundButton
            label={t("Continuar", "Continue")}
            icon={{ ios: "play.fill", android: "play_arrow" }}
            color={colors.primary}
            tint={colors.primaryForeground}
            onPress={onContinue}
          />
        </View>
      </View>
    </View>
  );
}
