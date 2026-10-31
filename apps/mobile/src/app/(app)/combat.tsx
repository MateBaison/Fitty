import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, Vibration, View } from "react-native";
import {
  CombatMachine,
  combatPresets,
  readCombatConfig,
  timeFormat,
  type CombatConfig,
  type CombatSignal,
} from "@fitty/core/domain/combat";
import { NumberInput } from "@/components/number-input";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const modes = [
  ["boxeo", "Boxeo", "Boxing"],
  ["muay-thai", "Muay thai", "Muay Thai"],
  ["tabata", "Tabata", "Tabata"],
  ["hiit", "HIIT", "HIIT"],
] as const;

function KeepAwake() {
  useKeepAwake();
  return null;
}

// Audio cues on the web become haptics and vibration patterns on the phone.
function signal(kind: CombatSignal) {
  if (kind === "round") Vibration.vibrate([0, 400]);
  else if (kind === "rest")
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === "warning")
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  else Vibration.vibrate([0, 300, 150, 300, 150, 600]);
}

export function CombatPanel() {
  const snapshot = useSnapshot();
  const { change, t } = useAccount();
  const router = useRouter();
  const [config, setConfig] = useState<CombatConfig>(() =>
    readCombatConfig(snapshot.settings.combatClock),
  );
  const machine = useRef(new CombatMachine(config));
  const [state, setState] = useState(machine.current.state);
  useEffect(() => {
    if (!state.running) return;
    const timer = setInterval(() => {
      machine.current.advance(Date.now()).forEach(signal);
      setState({ ...machine.current.state });
    }, 200);
    return () => clearInterval(timer);
  }, [state.running]);
  const configure = (next: CombatConfig) => {
    setConfig(next);
    machine.current.reset(next);
    setState({ ...machine.current.state });
    change((draft) => void (draft.settings.combatClock = next));
  };
  const phase =
    state.phase === "prep"
      ? t("Preparación", "Get ready")
      : state.phase === "work"
        ? t("Trabajo", "Work")
        : state.phase === "rest"
          ? t("Descanso", "Rest")
          : t("Terminado", "Finished");
  const field = (
    key: "rounds" | "work" | "rest" | "prep",
    label: string,
    min: number,
    max: number,
  ) => (
    <View style={{ width: "47%", gap: 6 }}>
      <Label muted>{label}</Label>
      <NumberInput
        value={config[key]}
        accessibilityLabel={label}
        onCommit={(value) => {
          if (state.running) return;
          configure({
            ...config,
            [key]: Math.min(max, Math.max(min, value ?? min)),
          });
        }}
      />
    </View>
  );
  return (
    <Card>
      {state.running ? <KeepAwake /> : null}
      <Text
        style={{
          color: "#fdba74",
          textAlign: "center",
          fontSize: 16,
          fontWeight: "700",
        }}
      >
        {phase} · {t("Ronda", "Round")} {state.round}/{config.rounds}
      </Text>
      <Text
        accessibilityRole="timer"
        style={{
          color: colors.foreground,
          fontSize: 76,
          fontWeight: "800",
          textAlign: "center",
          fontVariant: ["tabular-nums"],
          paddingVertical: space(3),
        }}
      >
        {timeFormat(
          state.running ? state.remaining : state.remaining || config.work,
        )}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3), justifyContent: "space-between" }}>
        {field("rounds", t("Rondas", "Rounds"), 1, 100)}
        {field("work", t("Trabajo (seg)", "Work (sec)"), 1, 3600)}
        {field("rest", t("Descanso (seg)", "Rest (sec)"), 0, 3600)}
        {field("prep", t("Preparación (seg)", "Preparation (sec)"), 0, 600)}
      </View>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => {
              machine.current.toggle(Date.now()).forEach(signal);
              setState({ ...machine.current.state });
            }}
          >
            {state.running ? t("Pausar", "Pause") : t("Iniciar", "Start")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            onPress={() => {
              machine.current.reset(config);
              setState({ ...machine.current.state });
            }}
          >
            {t("Reiniciar", "Reset")}
          </Button>
        </View>
      </View>
    </Card>
  );
}

export default function Combat() {
  const router = useRouter();
  const { t } = useAccount();
  return (
    <Screen>
      <Button variant="ghost" onPress={() => router.back()}>
        {`‹ ${t("Volver", "Back")}`}
      </Button>
      <CombatPanel />
    </Screen>
  );
}
