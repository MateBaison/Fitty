import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  calorieMetrics,
  calorieTargets,
  macroMetrics,
  oneRepMax,
} from "@fitty/core/domain/calculations/calculators";
import { ChipGroup } from "@/components/chip";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const pad = (value: number) => String(value).padStart(2, "0");
function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
function useNow(running: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [running]);
  return now;
}
function KeepAwake() {
  useKeepAwake();
  return null;
}
const num = (value: string) => Number(value.replace(",", "."));

function Stopwatch() {
  const { t } = useAccount();
  const [start, setStart] = useState<number | null>(null);
  const [saved, setSaved] = useState(0);
  const now = useNow(start !== null);
  const elapsed = saved + (start === null ? 0 : now - start);
  return (
    <Card>
      {start !== null ? <KeepAwake /> : null}
      <Label muted>{t("Cronómetro", "Stopwatch")}</Label>
      <Text
        accessibilityRole="timer"
        style={{
          color: colors.foreground,
          fontSize: 56,
          fontWeight: "800",
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {clock(elapsed)}
      </Text>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => {
              if (start === null) setStart(Date.now());
              else {
                setSaved(elapsed);
                setStart(null);
              }
            }}
          >
            {start === null ? t("Iniciar", "Start") : t("Pausar", "Pause")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            onPress={() => {
              setStart(null);
              setSaved(0);
            }}
          >
            {t("Reiniciar", "Reset")}
          </Button>
        </View>
      </View>
    </Card>
  );
}

function Timer() {
  const { t } = useAccount();
  const snapshot = useSnapshot();
  const [seconds, setSeconds] = useState(
    Math.max(5, Number(snapshot.settings.restSeconds) || 60),
  );
  const [end, setEnd] = useState<number | null>(null);
  const now = useNow(end !== null);
  const left = end === null ? seconds * 1000 : end - now;
  const notified = useRef(false);
  useEffect(() => {
    if (end !== null && left <= 0 && !notified.current) {
      notified.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEnd(null);
    }
  }, [end, left]);
  return (
    <Card>
      {end !== null ? <KeepAwake /> : null}
      <Label muted>{t("Temporizador", "Timer")}</Label>
      <Text
        accessibilityRole="timer"
        style={{
          color: colors.foreground,
          fontSize: 56,
          fontWeight: "800",
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {clock(left)}
      </Text>
      <ChipGroup
        options={[30, 60, 90, 120, 180].map((value) => ({
          value,
          label: `${value}s`,
        }))}
        value={seconds}
        onChange={(value) => {
          setSeconds(value);
          setEnd(null);
        }}
      />
      <Button
        onPress={() => {
          notified.current = false;
          setEnd(end === null ? Date.now() + seconds * 1000 : null);
        }}
      >
        {end === null ? t("Iniciar", "Start") : t("Detener", "Stop")}
      </Button>
    </Card>
  );
}

function OneRepMax() {
  const { t } = useAccount();
  const unit = useSnapshot().settings.weight ?? "kg";
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  let result: number | null = null;
  try {
    result = oneRepMax({ weight: num(weight), reps: num(reps) });
  } catch {
    result = null;
  }
  return (
    <Card>
      <Label muted>{t("1RM estimado", "Estimated 1RM")}</Label>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Field
            label={`${t("Peso", "Weight")} (${unit})`}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label={t("Repeticiones (1-10)", "Reps (1-10)")}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
          />
        </View>
      </View>
      {result !== null ? (
        <Text style={{ color: colors.accent, fontSize: 28, fontWeight: "800" }}>
          {Math.round(result * 10) / 10} {unit}
        </Text>
      ) : null}
    </Card>
  );
}

function Calories() {
  const { t } = useAccount();
  const profile = useSnapshot().profile;
  const age = profile.birth
    ? Math.floor((Date.now() - Date.parse(profile.birth)) / (365.25 * 86400000))
    : NaN;
  const [form, setForm] = useState({
    formula: profile.gender === "mujer" ? "female" : "male",
    age: Number.isFinite(age) ? String(age) : "",
    height: String(profile.height ?? ""),
    weight: String(profile.weight ?? ""),
    activity: 1.375,
    meals: 4,
  });
  let result: { bmr: number; maintenance: number } | null = null;
  try {
    result = calorieMetrics({
      formula: form.formula,
      age: num(form.age),
      heightCm: num(form.height),
      weightKg: num(form.weight),
      activity: form.activity,
    });
  } catch {
    result = null;
  }
  const targets = result ? calorieTargets(result.maintenance) : null;
  let macros: ReturnType<typeof macroMetrics> | null = null;
  try {
    macros = targets
      ? macroMetrics({
          calories: targets.maintenance,
          meals: form.meals,
          split: "balanced",
        })
      : null;
  } catch {
    macros = null;
  }
  return (
    <Card>
      <Label muted>{t("Calorías y macros", "Calories and macros")}</Label>
      <ChipGroup
        options={[
          { value: "male", label: t("Fórmula masculina", "Male formula") },
          { value: "female", label: t("Fórmula femenina", "Female formula") },
        ]}
        value={form.formula}
        onChange={(formula) => setForm({ ...form, formula })}
      />
      <View style={{ flexDirection: "row", gap: space(2) }}>
        <View style={{ flex: 1 }}>
          <Field
            label={t("Edad", "Age")}
            value={form.age}
            onChangeText={(age) => setForm({ ...form, age })}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="cm"
            value={form.height}
            onChangeText={(height) => setForm({ ...form, height })}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="kg"
            value={form.weight}
            onChangeText={(weight) => setForm({ ...form, weight })}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Label muted>{t("Actividad", "Activity")}</Label>
      <ChipGroup
        options={[
          { value: 1.2, label: t("Sedentaria", "Sedentary") },
          { value: 1.375, label: t("Ligera", "Light") },
          { value: 1.55, label: t("Moderada", "Moderate") },
          { value: 1.725, label: t("Alta", "High") },
          { value: 1.9, label: t("Muy alta", "Very high") },
        ]}
        value={form.activity}
        onChange={(activity) => setForm({ ...form, activity })}
      />
      {result && targets ? (
        <View style={{ gap: space(1) }}>
          <Label>
            {t("Metabolismo basal", "Basal metabolism")}: {result.bmr} kcal
          </Label>
          <Label>
            {t("Mantenimiento", "Maintenance")}: {targets.maintenance} kcal
          </Label>
          <Label muted>
            {t("Bajar", "Lose")}: {targets.loss} · {t("Subir", "Gain")}:{" "}
            {targets.gain} kcal
          </Label>
          {macros ? (
            <Label muted>
              {t("Carbohidratos", "Carbs")} {macros.daily.carbs} g ·{" "}
              {t("Proteínas", "Protein")} {macros.daily.protein} g ·{" "}
              {t("Grasas", "Fat")} {macros.daily.fat} g
            </Label>
          ) : null}
        </View>
      ) : (
        <Label muted>
          {t(
            "Completá los datos (18 a 100 años).",
            "Fill in the data (ages 18 to 100).",
          )}
        </Label>
      )}
    </Card>
  );
}

export default function Tools() {
  const { t } = useAccount();
  return (
    <Screen>
      <Title>{t("Herramientas", "Tools")}</Title>
      <Stopwatch />
      <Timer />
      <OneRepMax />
      <Calories />
    </Screen>
  );
}
