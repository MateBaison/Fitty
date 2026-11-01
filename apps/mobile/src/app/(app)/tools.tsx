import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  calorieMetrics,
  calorieTargets,
  macroMetrics,
  oneRepMax,
  weightGoal,
  type WeightGoalResult,
} from "@fitty/core/domain/calculations/calculators";
import { CombatPanel } from "@/app/(app)/combat";
import { TrackingPanel } from "@/app/(app)/tracking";
import { Button, Card, Field, Label, Screen } from "@/components/ui";
import { playRestDone } from "@/lib/sound";
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

function Pill({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: small ? 44 : 48,
        paddingHorizontal: space(small ? 4 : 5),
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? colors.primary : colors.secondary,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.foreground,
          fontWeight: "800",
          fontSize: small ? 14 : 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  small?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
      {options.map(([key, label]) => (
        <Pill
          key={key}
          label={label}
          active={value === key}
          small={small}
          onPress={() => onChange(key)}
        />
      ))}
    </View>
  );
}

/** Equal-width options in a grid (two per row), so the names line up neatly. */
function GridPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
      {options.map(([key, label]) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(key)}
            style={{
              width: "48.5%",
              minHeight: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: space(2),
              backgroundColor: active ? colors.primary : colors.secondary,
              borderColor: active ? colors.primary : colors.border,
              borderWidth: 1,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color: active ? colors.primaryForeground : colors.foreground,
                fontWeight: "800",
                fontSize: 15,
                textAlign: "center",
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Digits({ value }: { value: string }) {
  return (
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
      {value}
    </Text>
  );
}

function Stopwatch() {
  const { t } = useAccount();
  const [start, setStart] = useState<number | null>(null);
  const [saved, setSaved] = useState(0);
  const now = useNow(start !== null);
  const elapsed = saved + (start === null ? 0 : now - start);
  return (
    <Card>
      {start !== null ? <KeepAwake /> : null}
      <Digits value={clock(elapsed)} />
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

const timerPresets = [
  [15, "15seg"],
  [30, "30seg"],
  [60, "1min"],
  [180, "3min"],
  [300, "5min"],
] as const;

function Timer() {
  const { t } = useAccount();
  const [seconds, setSeconds] = useState(30);
  const [end, setEnd] = useState<number | null>(null);
  const now = useNow(end !== null);
  const left = end === null ? seconds * 1000 : end - now;
  const notified = useRef(false);
  useEffect(() => {
    if (end !== null && left <= 0 && !notified.current) {
      notified.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playRestDone();
      setEnd(null);
    }
  }, [end, left]);
  return (
    <Card>
      {end !== null ? <KeepAwake /> : null}
      <Digits value={clock(left)} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
        {timerPresets.map(([value, label]) => (
          <Pill
            key={value}
            label={label}
            small
            active={seconds === value}
            onPress={() => {
              setSeconds(value);
              setEnd(null);
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => {
              notified.current = false;
              setEnd(end === null ? Date.now() + seconds * 1000 : null);
            }}
          >
            {end === null ? t("Iniciar", "Start") : t("Detener", "Stop")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" onPress={() => setEnd(null)}>
            {t("Reiniciar", "Reset")}
          </Button>
        </View>
      </View>
    </Card>
  );
}

type Section = "calories" | "macros" | "maximum" | "goal";
const activities = [
  [1.2, "Sedentaria", "Sedentary"],
  [1.375, "Ligera", "Light"],
  [1.55, "Moderada", "Moderate"],
  [1.725, "Alta", "High"],
  [1.9, "Muy alta", "Very high"],
] as const;
const splits = [
  ["balanced", "Equilibrada", "Balanced"],
  ["protein", "Alta en proteína", "High protein"],
  ["lowerCarb", "Menos carbohidratos", "Lower carbohydrate"],
  ["keto", "Cetogénica", "Ketogenic"],
] as const;

function Calculators() {
  const { t } = useAccount();
  const snapshot = useSnapshot();
  const profile = snapshot.profile;
  const unit = snapshot.settings.weight ?? "kg";
  const factor = unit === "lb" ? 2.20462 : 1;
  const birthAge = profile.birth
    ? Math.floor((Date.now() - Date.parse(profile.birth)) / (365.25 * 86400000))
    : NaN;
  const [section, setSection] = useState<Section>("calories");
  const [sex, setSex] = useState<"male" | "female">(
    profile.gender === "mujer" ? "female" : "male",
  );
  const [age, setAge] = useState(Number.isFinite(birthAge) ? String(birthAge) : "30");
  const [weight, setWeight] = useState(String(Number(profile.weight) || 75));
  const [height, setHeight] = useState(String(Number(profile.height) || 175));
  const [activity, setActivity] = useState<1.2 | 1.375 | 1.55 | 1.725 | 1.9>(1.55);
  const [calories, setCalories] = useState("2200");
  const [meals, setMeals] = useState("3");
  const [split, setSplit] = useState<"balanced" | "protein" | "lowerCarb" | "keto">("balanced");
  const [load, setLoad] = useState("50");
  const [reps, setReps] = useState("5");
  const [target, setTarget] = useState(weight);
  const [error, setError] = useState("");
  const [targets, setTargets] = useState<ReturnType<typeof calorieTargets> | null>(null);
  const [basal, setBasal] = useState<number | null>(null);
  const [macros, setMacros] = useState<ReturnType<typeof macroMetrics> | null>(null);
  const [maximum, setMaximum] = useState<number | null>(null);
  const [goal, setGoal] = useState<WeightGoalResult | null>(null);
  const input = () => ({
    formula: sex,
    age: num(age),
    weightKg: num(weight) / factor,
    heightCm: num(height),
    activity,
  });
  const calculate = () => {
    try {
      setError("");
      if (section === "calories") {
        const metrics = calorieMetrics(input());
        setBasal(metrics.bmr);
        const result = calorieTargets(metrics.maintenance);
        setTargets(result);
        setCalories(String(result.maintenance));
      } else if (section === "macros")
        setMacros(
          macroMetrics({ calories: num(calories), meals: num(meals), split }),
        );
      else if (section === "maximum")
        setMaximum(oneRepMax({ weight: num(load), reps: num(reps) }));
      else setGoal(weightGoal({ ...input(), targetKg: num(target) / factor }));
    } catch {
      setError(
        t(
          "Revisá los valores: edad 18–100, peso 25–400 kg, altura 100–250 cm; macros 1000–6000 kcal y 1–8 comidas; 1RM 1–10 repeticiones.",
          "Check the values: age 18–100, weight 25–400 kg, height 100–250 cm; macros 1000–6000 kcal and 1–8 meals; 1RM 1–10 reps.",
        ),
      );
    }
  };
  const useForMacros = (value: number) => {
    setCalories(String(value));
    setMacros(null);
    setError("");
    setSection("macros");
  };
  const title =
    section === "calories"
      ? t("Calculadora de calorías", "Calorie calculator")
      : section === "macros"
        ? t("Calculadora de macros", "Macro calculator")
        : section === "maximum"
          ? t("1RM", "1RM")
          : t("Estimación de objetivo de peso", "Weight goal estimate");
  const bodyFields = (
    <>
      <Label muted>{t("Sexo", "Sex")}</Label>
      <Pills
        small
        options={[
          ["male", t("Masculino", "Male")],
          ["female", t("Femenino", "Female")],
        ]}
        value={sex}
        onChange={setSex}
      />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Field label={t("Edad", "Age")} value={age} onChangeText={setAge} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={`${t("Peso", "Weight")} (${unit})`} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={`${t("Altura", "Height")} (cm)`} value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
        </View>
      </View>
      <Label muted>{t("Actividad", "Activity")}</Label>
      <Pills
        small
        options={activities.map(([value, es, en]) => [String(value), t(es, en)] as const)}
        value={String(activity)}
        onChange={(value) => setActivity(Number(value) as typeof activity)}
      />
    </>
  );
  return (
    <>
      <GridPills
        options={[
          ["calories", t("Calorías", "Calories")],
          ["macros", "Macros"],
          ["maximum", t("1RM", "1RM")],
          ["goal", t("Objetivo de peso", "Weight goal")],
        ]}
        value={section}
        onChange={(value) => {
          setSection(value);
          setError("");
        }}
      />
      <Card>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
          {title}
        </Text>
        {section === "calories" || section === "goal" ? bodyFields : null}
        {section === "goal" ? (
          <Field
            label={`${t("Peso deseado", "Target weight")} (${unit})`}
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
          />
        ) : null}
        {section === "macros" ? (
          <>
            <Field label={t("Objetivo diario (kcal)", "Daily target (kcal)")} value={calories} onChangeText={setCalories} keyboardType="number-pad" />
            <Field label={t("Comidas por día", "Meals per day")} value={meals} onChangeText={setMeals} keyboardType="number-pad" />
            <Label muted>{t("Distribución", "Distribution")}</Label>
            <Pills
              small
              options={splits.map(([value, es, en]) => [value, t(es, en)] as const)}
              value={split}
              onChange={setSplit}
            />
          </>
        ) : null}
        {section === "maximum" ? (
          <View style={{ flexDirection: "row", gap: space(3) }}>
            <View style={{ flex: 1 }}>
              <Field label={`${t("Peso levantado", "Lifted weight")} (${unit})`} value={load} onChangeText={setLoad} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("Repeticiones (1–10)", "Repetitions (1–10)")} value={reps} onChangeText={setReps} keyboardType="number-pad" />
            </View>
          </View>
        ) : null}
        <Button onPress={calculate}>
          {section === "calories"
            ? t("Calcular calorías", "Calculate calories")
            : section === "macros"
              ? t("Calcular macros", "Calculate macros")
              : section === "maximum"
                ? t("Calcular 1RM", "Calculate 1RM")
                : t("Estimar objetivo", "Estimate goal")}
        </Button>
        {error ? <Label>{error}</Label> : null}
        {section === "calories" && targets && basal !== null ? (
          <View style={{ gap: space(2) }}>
            <Result label={t("Metabolismo basal", "Basal metabolism")} value={`${basal} kcal`} />
            <Result label={t("Bajar de peso", "Lose weight")} value={`${targets.loss} kcal`} onUse={() => useForMacros(targets.loss)} />
            <Result label={t("Mantenerse", "Maintain weight")} value={`${targets.maintenance} kcal`} onUse={() => useForMacros(targets.maintenance)} />
            <Result label={t("Subir de peso", "Gain weight")} value={`${targets.gain} kcal`} onUse={() => useForMacros(targets.gain)} />
          </View>
        ) : null}
        {section === "macros" && macros ? (
          <View style={{ gap: space(2) }}>
            <Result label={t("Carbohidratos", "Carbohydrates")} value={`${macros.daily.carbs} g`} />
            <Result label={t("Proteínas", "Protein")} value={`${macros.daily.protein} g`} />
            <Result label={t("Grasas", "Fat")} value={`${macros.daily.fat} g`} />
            <Label muted>
              {t("Por comida", "Per meal")} · {meals} {t("comidas", "meals")}
            </Label>
            <Result label={t("Calorías por comida", "Calories per meal")} value={`${macros.perMeal.calories} kcal`} />
            <Result label={t("Carbohidratos por comida", "Carbs per meal")} value={`${macros.perMeal.carbs} g`} />
            <Result label={t("Proteínas por comida", "Protein per meal")} value={`${macros.perMeal.protein} g`} />
            <Result label={t("Grasas por comida", "Fat per meal")} value={`${macros.perMeal.fat} g`} />
          </View>
        ) : null}
        {section === "maximum" && maximum !== null ? (
          <Result
            label={t("1RM estimado · fórmula de Epley", "Estimated 1RM · Epley formula")}
            value={`${Math.round(maximum * 10) / 10} ${unit}`}
          />
        ) : null}
        {section === "goal" && goal ? (
          goal.kind === "message" ? (
            <Label>
              {goal.reason === "already-at-target"
                ? t("Ya estás en el peso elegido.", "You are already at the chosen weight.")
                : t(
                    "Esta estimación no es adecuada para esos datos. Consultá con un profesional antes de reducir la ingesta.",
                    "This estimate is not suitable for those values. Consult a professional before reducing intake.",
                  )}
            </Label>
          ) : (
            <View style={{ gap: space(2) }}>
              <Result
                label={t("Rango orientativo, no una fecha garantizada", "Estimated range, not a guaranteed date")}
                value={`${goal.fastWeeks}–${goal.slowWeeks} ${t("semanas", "weeks")}`}
              />
              {goal.milestones.map((milestone, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    padding: space(3),
                    borderRadius: 14,
                    backgroundColor: index % 2 ? "#13171f" : colors.secondary,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                    {(milestone.kg * factor).toFixed(1)} {unit}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {milestone.fastWeeks}–{milestone.slowWeeks} {t("sem", "wk")}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {milestone.calories < 1200
                      ? t("Consultar", "Consult")
                      : `${milestone.calories} kcal`}
                  </Text>
                </View>
              ))}
              <Label muted>
                {t(
                  "El rango usa un cambio semanal gradual del peso; no predice cuánto será grasa o músculo. La actividad, adherencia, salud y retención de líquidos pueden cambiar el resultado.",
                  "The range uses gradual weekly weight change; it does not predict how much will be fat or muscle. Activity, adherence, health and water retention can affect the result.",
                )}
              </Label>
            </View>
          )
        ) : null}
        <Label muted>
          {t(
            "Estimaciones para adultos, no indicaciones médicas. Hacé ajustes y chequeos cada 2–3 semanas según la evolución real. Si tenés una condición de salud, embarazo o antecedentes de trastornos alimentarios, consultá con un profesional.",
            "Estimates for adults, not medical prescriptions. Review and adjust every 2–3 weeks based on actual changes. Consult a professional if you have a health condition, are pregnant or have a history of eating disorders.",
          )}
        </Label>
      </Card>
    </>
  );
}

function Result({
  label,
  value,
  onUse,
}: {
  label: string;
  value: string;
  onUse?: () => void;
}) {
  const { t } = useAccount();
  const body = (
    <View
      style={{
        padding: space(3),
        borderRadius: 14,
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.secondary,
        gap: 2,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
        {value}
      </Text>
      {onUse ? (
        <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
          {t("Usar en macros →", "Use for macros →")}
        </Text>
      ) : null}
    </View>
  );
  return onUse ? (
    <Pressable accessibilityRole="button" onPress={onUse}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export default function Tools() {
  const { t } = useAccount();
  const [group, setGroup] = useState<"clock" | "calculators">("clock");
  const [tool, setTool] = useState<"stopwatch" | "timer" | "combat" | "tracking">("stopwatch");
  return (
    <Screen>
      <GridPills
        options={[
          ["clock", t("Reloj", "Clock")],
          ["calculators", t("Calculadoras", "Calculators")],
        ]}
        value={group}
        onChange={setGroup}
      />
      {group === "clock" ? (
        <>
          <GridPills
            options={[
              ["stopwatch", t("Cronómetro", "Stopwatch")],
              ["timer", t("Temporizador", "Timer")],
              ["combat", t("Combate", "Combat")],
              ["tracking", t("Recorrido GPS", "GPS route")],
            ]}
            value={tool}
            onChange={setTool}
          />
          {tool === "stopwatch" ? <Stopwatch /> : null}
          {tool === "timer" ? <Timer /> : null}
          {tool === "combat" ? <CombatPanel /> : null}
          {tool === "tracking" ? <TrackingPanel /> : null}
        </>
      ) : (
        <Calculators />
      )}
    </Screen>
  );
}
