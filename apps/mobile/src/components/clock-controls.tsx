import { SymbolView } from "expo-symbols";
import { Pressable, View } from "react-native";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Round icon button for clock controls (play, pause, stop, reset). */
function ClockButton({
  icon,
  label,
  onPress,
  main = false,
}: {
  icon: "play" | "pause" | "stop" | "reset";
  label: string;
  onPress: () => void;
  main?: boolean;
}) {
  const names = {
    play: { ios: "play.fill", android: "play_arrow" },
    pause: { ios: "pause.fill", android: "pause" },
    stop: { ios: "stop.fill", android: "stop" },
    reset: { ios: "arrow.counterclockwise", android: "replay" },
  } as const;
  const size = main ? 72 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          icon === "stop"
            ? colors.destructive
            : main
              ? colors.primary
              : colors.secondary,
        borderColor:
          icon === "stop"
            ? colors.destructive
            : main
              ? colors.primary
              : colors.border,
        borderWidth: 1,
      }}
    >
      <SymbolView
        name={names[icon]}
        tintColor="#ffffff"
        size={main ? 30 : 22}
      />
    </Pressable>
  );
}

/** Stop sits on the left only while something is running or paused. */
export function ClockControls({
  running,
  active,
  onToggle,
  onStop,
  onReset,
}: {
  running: boolean;
  active: boolean;
  onToggle: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const { t } = useAccount();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space(4),
      }}
    >
      <View style={{ width: 52 }}>
        {active ? (
          <ClockButton icon="stop" label={t("Detener", "Stop")} onPress={onStop} />
        ) : null}
      </View>
      <ClockButton
        main
        icon={running ? "pause" : "play"}
        label={
          running ? t("Pausar", "Pause") : active ? t("Continuar", "Resume") : t("Iniciar", "Start")
        }
        onPress={onToggle}
      />
      <ClockButton icon="reset" label={t("Reiniciar", "Reset")} onPress={onReset} />
    </View>
  );
}
