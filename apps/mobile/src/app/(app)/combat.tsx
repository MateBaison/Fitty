import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, Vibration, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  CombatMachine,
  combatTone,
  combatPresets,
  readCombatConfig,
  timeFormat,
  type CombatConfig,
  type CombatSignal,
} from "@fitty/core/domain/combat";
import { ClockControls } from "@/components/clock-controls";
import { playSound } from "@/lib/sound";
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

/** Thin frame whose color fades from top to bottom instead of ending abruptly. */
function ToneFrame({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
      style={{ paddingVertical: space(2) }}
    >
      {size.width ? (
        <Svg
          pointerEvents="none"
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Defs>
            <LinearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="1" />
              <Stop offset="1" stopColor={color} stopOpacity="0.25" />
            </LinearGradient>
            <LinearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.16" />
              <Stop offset="1" stopColor={color} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={22}
            fill="url(#tint)"
            stroke="url(#frame)"
            strokeWidth={2}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

// Audio cues on the web become haptics and vibration patterns on the phone.
function signal(kind: CombatSignal) {
  playSound(
    kind === "round"
      ? "round"
      : kind === "rest"
        ? "breather"
        : kind === "warning"
          ? "warning"
          : "end",
  );
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
  const tone = combatTone(state, config);
  const frame =
    tone === "work"
      ? "#22c55e"
      : tone === "rest"
        ? "#ef4444"
        : tone === "warning"
          ? "#facc15"
          : colors.border;
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
      <ToneFrame color={frame}>
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
      </ToneFrame>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3), justifyContent: "space-between" }}>
        {field("rounds", t("Rondas", "Rounds"), 1, 100)}
        {field("work", t("Trabajo (seg)", "Work (sec)"), 1, 3600)}
        {field("rest", t("Descanso (seg)", "Rest (sec)"), 0, 3600)}
        {field("prep", t("Preparación (seg)", "Preparation (sec)"), 0, 600)}
      </View>
      <ClockControls
        running={state.running}
        active={state.running || (state.remaining > 0 && state.phase !== "done")}
        onToggle={() => {
          machine.current.toggle(Date.now()).forEach(signal);
          setState({ ...machine.current.state });
        }}
        onStop={() => {
          machine.current.reset(config);
          setState({ ...machine.current.state });
        }}
        onReset={() => {
          machine.current.reset(config);
          setState({ ...machine.current.state });
        }}
      />
    </Card>
  );
}

export default function Combat() {
  const router = useRouter();
  const { t } = useAccount();
  return (
    <Screen>
      <Button variant="secondary" onPress={() => router.back()}>
        {`‹ ${t("Volver", "Back")}`}
      </Button>
      <CombatPanel />
    </Screen>
  );
}
