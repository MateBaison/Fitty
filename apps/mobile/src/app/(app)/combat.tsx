import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, Vibration } from "react-native";
import {
  CombatMachine,
  combatPresets,
  readCombatConfig,
  timeFormat,
  type CombatConfig,
  type CombatSignal,
} from "@fitty/core/domain/combat";
import { ChipGroup } from "@/components/chip";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors } from "@/theme";

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
        ? t("Round", "Round")
        : state.phase === "rest"
          ? t("Descanso", "Rest")
          : t("Terminado", "Finished");
  return (
    <>
      <Card>
        {state.running ? <KeepAwake /> : null}
        <Label muted style={{ textAlign: "center" }}>
          {phase} · {state.round}/{config.rounds}
        </Label>
        <Text
          accessibilityRole="timer"
          style={{
            color:
              state.phase === "rest"
                ? colors.success
                : state.phase === "work"
                  ? colors.warning
                  : colors.foreground,
            fontSize: 72,
            fontWeight: "800",
            textAlign: "center",
            fontVariant: ["tabular-nums"],
          }}
        >
          {timeFormat(
            state.running ? state.remaining : state.remaining || config.work,
          )}
        </Text>
        <Button
          onPress={() => {
            machine.current.toggle(Date.now()).forEach(signal);
            setState({ ...machine.current.state });
          }}
        >
          {state.running ? t("Pausar", "Pause") : t("Iniciar", "Start")}
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            machine.current.reset(config);
            setState({ ...machine.current.state });
          }}
        >
          {t("Reiniciar", "Reset")}
        </Button>
      </Card>
      <Card>
        <Label muted>{t("Modo", "Mode")}</Label>
        <ChipGroup
          options={modes.map(([value, es, en]) => ({
            value,
            label: t(es, en),
          }))}
          value={config.mode}
          onChange={(mode) =>
            !state.running &&
            configure({ ...config, mode, ...combatPresets[mode] })
          }
        />
        <Label muted>{t("Rounds", "Rounds")}</Label>
        <ChipGroup
          options={[3, 5, 8, 10, 12].map((value) => ({
            value,
            label: String(value),
          }))}
          value={config.rounds}
          onChange={(rounds) =>
            !state.running && configure({ ...config, rounds })
          }
        />
        <Label muted>{t("Trabajo", "Work")}</Label>
        <ChipGroup
          options={[20, 40, 60, 120, 180].map((value) => ({
            value,
            label: timeFormat(value),
          }))}
          value={config.work}
          onChange={(work) => !state.running && configure({ ...config, work })}
        />
        <Label muted>{t("Descanso", "Rest")}</Label>
        <ChipGroup
          options={[0, 10, 20, 30, 60].map((value) => ({
            value,
            label: timeFormat(value),
          }))}
          value={config.rest}
          onChange={(rest) => !state.running && configure({ ...config, rest })}
        />
        <Label muted>{t("Preparación", "Get ready")}</Label>
        <ChipGroup
          options={[0, 5, 10, 15].map((value) => ({
            value,
            label: `${value}s`,
          }))}
          value={config.prep}
          onChange={(prep) => !state.running && configure({ ...config, prep })}
        />
      </Card>
    </>
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
