import { usePathname, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { BarDrawer } from "@/components/bar-drawer";
import { useElapsedTime } from "@/lib/use-elapsed-time";
import { useAccount, useSnapshot } from "@/state/account";
import { colors } from "@/theme";

function Action({
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
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <SymbolView name={icon} tintColor={tint} size={18} weight="bold" />
    </Pressable>
  );
}

/**
 * The workout in progress on the home screen, above the bottom bar: the time
 * since it started, and the ways to cancel or continue it.
 */
export function WorkoutDrawer() {
  const { change, t } = useAccount();
  const started = useSnapshot().workout?.started;
  const home = usePathname() === "/";
  const router = useRouter();
  // Kept while it slides back down.
  const [last, setLast] = useState(started);
  if (started !== undefined && started !== last) setLast(started);
  const elapsed = useElapsedTime(started ?? last ?? NaN);
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
    <BarDrawer open={home && started !== undefined}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: colors.primary,
              // A soft halo of the same blue.
              boxShadow: `0 0 8px 3px ${colors.primary}b3, 0 0 16px 6px ${colors.primary}4d`,
            }}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              flexShrink: 1,
              color: colors.foreground,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {t("Entrenamiento en curso", "Workout in progress")}
          </Text>
        </View>
        <Text
          accessibilityRole="timer"
          accessibilityLabel={`${t("Tiempo transcurrido", "Elapsed time")}: ${elapsed}`}
          style={{
            // In line with the text beside the dot.
            marginStart: 17,
            alignSelf: "flex-start",
            color: colors.foreground,
            fontSize: 20,
            fontWeight: "800",
            fontVariant: ["tabular-nums"],
          }}
        >
          {elapsed}
        </Text>
      </View>
      <Action
        label={t("Cancelar entrenamiento", "Cancel workout")}
        icon={{ ios: "xmark", android: "close" }}
        color={colors.destructive}
        tint="#ffffff"
        onPress={cancel}
      />
      <Action
        label={t("Continuar", "Continue")}
        icon={{ ios: "play.fill", android: "play_arrow" }}
        color={colors.primary}
        tint={colors.primaryForeground}
        onPress={() => router.navigate("/workout")}
      />
    </BarDrawer>
  );
}
