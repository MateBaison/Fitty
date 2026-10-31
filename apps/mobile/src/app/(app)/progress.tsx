import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { translate } from "@fitty/core/data/translations";
import { recordPanel } from "@fitty/core/domain/personal-records";
import {
  exerciseHistories,
  recentImprovements,
} from "@fitty/core/domain/progress";
import {
  compareProgress,
  comparisonDates,
} from "@fitty/core/domain/progress-comparison";
import {
  muscleTotals,
  newRecordCount,
  periodSessions,
  progressRange,
  progressTotals,
  shiftProgressDate,
  type ProgressPeriod,
} from "@fitty/core/domain/progress-period";
import { catalogFor, localDateKey } from "@fitty/core/domain/workouts";
import { BodyPanel } from "@/app/(app)/body";
import { ProgressChart, type ChartPoint } from "@/components/progress-chart";
import { Button, Card, Field, Label, Screen } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const periods = [
  ["day", "Día", "Day"],
  ["week", "Semana", "Week"],
  ["month", "Mes", "Month"],
  ["quarter", "3 meses", "3 months"],
  ["year", "Año", "Year"],
  ["all", "Siempre", "Lifetime"],
] as const;

function Pill({
  label,
  active,
  onPress,
  small = true,
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
        minHeight: small ? 40 : 48,
        paddingHorizontal: space(4),
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
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const heading = {
  color: colors.foreground,
  fontSize: 20,
  fontWeight: "800" as const,
};

/** Two editable date ranges (YYYY-MM-DD), compared side by side like the web. */
function Comparison({
  range,
  period,
}: {
  range: { start: Date; end: Date };
  period: ProgressPeriod;
}) {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const locale = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const factor = unit === "lb" ? 2.20462 : 1;
  const base = period === "all" ? "month" : period;
  const initial = period === "all" ? progressRange("month", new Date()) : range;
  const [dates, setDates] = useState(() => ({
    a: comparisonDates(
      progressRange(base, shiftProgressDate(initial.start, base, -1), true),
    ),
    b: comparisonDates(initial),
  }));
  const set = (key: "a" | "b", edge: "start" | "end", value: string) =>
    setDates((current) => ({
      ...current,
      [key]: { ...current[key], [edge]: value },
    }));
  const totals = compareProgress(snapshot, dates.a, dates.b);
  const number = (value: number) =>
    value.toLocaleString(locale, { maximumFractionDigits: 1 });
  type Totals = NonNullable<typeof totals>[0];
  const rows: [string, (x: Totals) => string][] = [
    [t("Entrenamientos", "Workouts"), (x) => number(x.sessions)],
    [t("Días entrenados", "Training days"), (x) => number(x.days)],
    [
      t("Tiempo registrado", "Recorded time"),
      (x) => (x.sessions > 0 && x.unknown === x.sessions ? "—" : `${number(x.minutes)} min`),
    ],
    [t("Series", "Sets"), (x) => number(x.sets)],
    [t("Volumen", "Volume"), (x) => `${number(x.volumeKg * factor)} ${unit}`],
  ];
  return (
    <Card>
      <Text style={heading}>{t("Comparar períodos", "Compare periods")}</Text>
      <Label muted>
        {t(
          "Elegí dos rangos de fechas (AAAA-MM-DD). Las cifras muestran lo registrado en cada uno; más cantidad no siempre significa mejor progreso.",
          "Choose two date ranges (YYYY-MM-DD). Figures show what was logged in each; a higher amount does not always mean better progress.",
        )}
      </Label>
      {(["a", "b"] as const).map((key) => (
        <View key={key} style={{ gap: space(2) }}>
          <Text style={{ color: colors.foreground, fontWeight: "800" }}>
            {key === "a" ? t("Período A", "Period A") : t("Período B", "Period B")}
          </Text>
          <View style={{ flexDirection: "row", gap: space(3) }}>
            {(["start", "end"] as const).map((edge) => (
              <View key={edge} style={{ flex: 1 }}>
                <Field
                  label={edge === "start" ? t("Desde", "From") : t("Hasta", "To")}
                  value={dates[key][edge]}
                  onChangeText={(value) => set(key, edge, value)}
                  placeholder="AAAA-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
      {totals ? (
        <>
          <View style={{ flexDirection: "row", paddingHorizontal: space(2) }}>
            <Text style={{ flex: 1.4, color: colors.muted, fontSize: 12 }}>
              {t("Métrica", "Metric")}
            </Text>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 12, textAlign: "right" }}>
              {t("Período A", "Period A")}
            </Text>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 12, textAlign: "right" }}>
              {t("Período B", "Period B")}
            </Text>
          </View>
          {rows.map(([label, get], index) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                padding: space(3),
                borderRadius: 14,
                backgroundColor: index % 2 ? "#13171f" : colors.secondary,
              }}
            >
              <Text style={{ flex: 1.4, color: colors.foreground, fontWeight: "700" }}>
                {label}
              </Text>
              <Text style={{ flex: 1, color: colors.foreground, textAlign: "right" }}>
                {get(totals[0])}
              </Text>
              <Text style={{ flex: 1, color: colors.foreground, textAlign: "right" }}>
                {get(totals[1])}
              </Text>
            </View>
          ))}
          <Label muted>
            {t(
              "Volumen = peso × repeticiones de las series registradas. No equivale a fuerza y depende de los ejercicios elegidos.",
              "Volume = weight × repetitions of logged sets. It is not strength and depends on the exercises chosen.",
            )}
          </Label>
        </>
      ) : (
        <Label>
          {t(
            "Elegí fechas válidas: el inicio debe ser anterior o igual al final.",
            "Choose valid dates: the start must be on or before the end.",
          )}
        </Label>
      )}
    </Card>
  );
}

export default function Progress() {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const locale = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const factor = unit === "lb" ? 2.20462 : 1;
  const [tab, setTab] = useState<"summary" | "exercises" | "body">("summary");
  const [period, setPeriod] = useState<ProgressPeriod>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [advance, setAdvance] = useState<"week" | "month" | "quarter">("month");
  const [selected, setSelected] = useState("");
  const [metric, setMetric] = useState<"weight" | "reps" | "volume" | "seconds">("weight");
  const [warmups, setWarmups] = useState(false);
  const [picking, setPicking] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [details, setDetails] = useState(false);
  const range = progressRange(period, anchor, false);
  const chosenSessions = periodSessions(snapshot, range);
  const scoped = { ...snapshot, sessions: chosenSessions };
  const totals = progressTotals(scoped);
  const catalog = catalogFor(snapshot, true);
  const histories = useMemo(
    () => exerciseHistories(snapshot, warmups),
    [snapshot, warmups],
  );
  const recorded = catalog.filter((exercise) => histories.has(exercise.id));
  const selectedId = selected || recorded[0]?.id || "";
  const selectedExercise = catalog.find((exercise) => exercise.id === selectedId);
  const history = (histories.get(selectedId) ?? []).filter(
    (record) => record.date >= range.start && record.date < range.end,
  );
  const allRecords = useMemo(() => recordPanel(snapshot), [snapshot]);
  const bestRecords = allRecords.filter(
    (record) =>
      record.exerciseId === selectedId &&
      new Date(record.date) >= range.start &&
      new Date(record.date) < range.end,
  );
  const advances = recentImprovements(
    snapshot,
    new Date(),
    shiftProgressDate(new Date(), advance, -1),
  );
  const newRecords = useMemo(
    () => newRecordCount(snapshot, chosenSessions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, period, anchor],
  );
  const counts = muscleTotals(scoped);
  const muscles = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...Object.values(counts));
  const duration = (minutes: number) =>
    `${Math.floor(minutes / 60)} h ${Math.round(minutes % 60)} min`;
  const formatSet = (weight: number, quantity: number, kind: string) =>
    `${(weight * factor).toLocaleString(locale, { maximumFractionDigits: 1 })} ${unit} × ${quantity} ${kind === "seconds" ? "s" : t("Rep", "Reps")}`;
  const points: ChartPoint[] = history.flatMap((record) => {
    const sets = record.sets.filter((set) =>
      metric === "seconds"
        ? set.metric === "seconds"
        : metric === "reps" || metric === "volume"
          ? set.metric === "reps"
          : true,
    );
    if (!sets.length) return [];
    const best = [...sets].sort((a, b) => b.kg - a.kg || b.value - a.value)[0]!;
    return [
      {
        date: record.date,
        value:
          metric === "weight"
            ? Math.max(...sets.map((set) => set.kg * factor))
            : metric === "volume"
              ? sets.reduce((sum, set) => sum + set.kg * factor * set.value, 0)
              : Math.max(...sets.map((set) => set.value)),
        detail:
          metric === "weight"
            ? formatSet(best.kg, best.value, best.metric)
            : undefined,
      },
    ];
  });
  const number = (value: number) =>
    value.toLocaleString(locale, { maximumFractionDigits: 1 });
  const stat = (label: string, value: string) => (
    <View
      key={label}
      style={{
        flex: 1,
        minWidth: 100,
        padding: space(3),
        borderRadius: 18,
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.card,
        gap: 2,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
        {value}
      </Text>
    </View>
  );
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space(3),
          paddingTop: space(2),
        }}
      >
        <View style={{ flex: 1, gap: space(1) }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {t("Tu recorrido", "Your journey")}
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>
            {t("Cada entrenamiento cuenta", "Every workout counts")}
          </Text>
          <Label muted>
            {t(
              "Mirá lo que hiciste y cómo venís avanzando.",
              "See what you did and how you are progressing.",
            )}
          </Label>
        </View>
        <SymbolView
          name={{ ios: "waveform.path.ecg", android: "monitor_heart" }}
          tintColor={colors.primary}
          size={40}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          padding: 6,
          gap: 6,
          borderRadius: 20,
          borderColor: colors.border,
          borderWidth: 1,
          backgroundColor: colors.card,
        }}
      >
        {(
          [
            ["summary", "Resumen", "Summary"],
            ["exercises", "Ejercicios", "Exercises"],
            ["body", "Cuerpo", "Body"],
          ] as const
        ).map(([id, es, en]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === id }}
            onPress={() => setTab(id)}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tab === id ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: tab === id ? colors.primaryForeground : colors.foreground,
              }}
            >
              {t(es, en)}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "summary" ? (
        <Card>
          <Text style={heading}>{t("Avances recientes", "Recent improvements")}</Text>
          <Label muted>{t("Período de avances", "Improvement period")}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
            {(
              [
                ["week", "1 semana", "1 week"],
                ["month", "1 mes", "1 month"],
                ["quarter", "3 meses", "3 months"],
              ] as const
            ).map(([id, es, en]) => (
              <Pill key={id} label={t(es, en)} active={advance === id} onPress={() => setAdvance(id)} />
            ))}
          </View>
          {advances.length ? (
            advances.slice(0, 3).map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setSelected(item.id);
                  setTab("exercises");
                }}
                style={{
                  padding: space(3),
                  borderRadius: 16,
                  borderColor: colors.border,
                  borderWidth: 1,
                  backgroundColor: "#0b0e14",
                  gap: 4,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 16 }}>
                  {translate(
                    locale,
                    catalog.find((exercise) => exercise.id === item.id)?.name ?? item.id,
                    catalog.find((exercise) => exercise.id === item.id)?.name ?? item.id,
                  )}
                </Text>
                <Text style={{ color: colors.primary, fontWeight: "800" }}>
                  {formatSet(item.result.before.kg, item.result.before.value, item.result.before.metric)}
                  {" → "}
                  {formatSet(item.result.after.kg, item.result.after.value, item.result.after.metric)}
                </Text>
                <Label muted>{item.date.toLocaleDateString(locale)}</Label>
              </Pressable>
            ))
          ) : (
            <Label muted>
              {t(
                "Las mejoras aparecerán cuando tengas sesiones comparables. Tu primera marca es el punto de partida.",
                "Improvements will appear when you have comparable sessions. Your first performance is your starting point.",
              )}
            </Label>
          )}
        </Card>
      ) : null}
      {tab !== "body" ? (
        <Card>
          <Label muted>{t("Período", "Period")}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
            {periods.map(([id, es, en]) => (
              <Pill
                key={id}
                label={t(es, en)}
                active={period === id}
                onPress={() => {
                  setPeriod(id);
                  setAnchor(new Date());
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
            <View style={{ width: 48 }}>
              <Button variant="secondary" disabled={period === "all"} onPress={() => setAnchor(shiftProgressDate(range.start, period, -1))}>
                ‹
              </Button>
            </View>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                color: colors.foreground,
                fontWeight: "800",
              }}
            >
              {period === "all"
                ? t("Todo el historial", "Full history")
                : range.start.toLocaleDateString(locale)}
            </Text>
            <View style={{ width: 48 }}>
              <Button variant="secondary" disabled={period === "all"} onPress={() => setAnchor(shiftProgressDate(range.start, period, 1))}>
                ›
              </Button>
            </View>
            <View style={{ width: 84 }}>
              <Button variant="secondary" onPress={() => setAnchor(new Date())}>
                {t("Hoy", "Today")}
              </Button>
            </View>
          </View>
        </Card>
      ) : null}
      {tab === "summary" ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3) }}>
            {stat(t("Entrenamientos", "Workouts"), String(totals.sessions))}
            {stat(
              t("Tiempo registrado", "Recorded time"),
              totals.sessions > 0 && totals.unknown === totals.sessions
                ? "—"
                : duration(totals.minutes),
            )}
            {stat(t("Días entrenados", "Training days"), String(totals.days))}
          </View>
          {!totals.sessions ? (
            <Label muted>
              {t(
                "Todavía no hay entrenamientos en este período. Tu progreso va a aparecer después de guardar una sesión.",
                "No workouts in this period yet. Your progress will appear after you save a session.",
              )}
            </Label>
          ) : null}
          <Label muted>
            {t(
              "Este período: cuánto entrenaste. Ejercicios: cómo cambiaron tus marcas. Cuerpo: tus medidas y fotos.",
              "This period: how much you trained. Exercises: how your performances changed. Body: your measurements and photos.",
            )}
          </Label>
          <Button variant="secondary" onPress={() => setComparing((value) => !value)}>
            {comparing
              ? t("Cerrar comparación", "Close comparison")
              : t("Comparar períodos", "Compare periods")}
          </Button>
          {comparing ? (
            <Comparison
              key={`${period}-${localDateKey(range.start)}`}
              range={range}
              period={period}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            onPress={() => setDetails((value) => !value)}
            style={{
              padding: space(4),
              borderRadius: 20,
              borderColor: colors.border,
              borderWidth: 1,
              backgroundColor: colors.card,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "800" }}>
              {t("Ver detalle del entrenamiento", "View training details")}
            </Text>
            <Text style={{ color: colors.muted }}>{details ? "▲" : "▼"}</Text>
          </Pressable>
          {details ? (
            <Card>
              <Label>
                {t("Series", "Sets")}: {totals.sets} · {t("Nuevos récords", "New records")}: {newRecords}
              </Label>
              <Text style={heading}>
                {t("Series por zona muscular", "Sets per muscle group")}
              </Text>
              {muscles.map(([group, count]) => (
                <View key={group} style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
                  <Text style={{ width: 96, color: colors.foreground, fontSize: 13 }}>
                    {translate(locale, group, group)}
                  </Text>
                  <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.secondary }}>
                    <View
                      style={{
                        width: `${(count / max) * 100}%`,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                  <Text style={{ width: 28, textAlign: "right", color: colors.foreground, fontWeight: "800" }}>
                    {count}
                  </Text>
                </View>
              ))}
              <Label muted>
                {t("Días entrenados", "Training days")}: {totals.days} · {t("Volumen", "Volume")}:{" "}
                {Math.round(totals.volumeKg * factor).toLocaleString(locale)} {unit}
              </Label>
              <Label muted>
                {t(
                  "Cada ejercicio cuenta para su zona principal. No mide intensidad, recuperación ni entrenamiento de músculos secundarios.",
                  "Each exercise counts towards its main muscle group. This does not measure intensity, recovery or secondary muscle training.",
                )}
              </Label>
            </Card>
          ) : null}
        </>
      ) : null}
      {tab === "exercises" ? (
        <Card>
          <Text style={heading}>{t("Evolución por ejercicio", "Exercise progression")}</Text>
          <Label muted>
            {t(
              "Tus marcas, evolución e historial en un solo lugar.",
              "Your bests, progression and history in one place.",
            )}
          </Label>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPicking(true)}
            style={{
              minHeight: 52,
              borderRadius: 16,
              paddingHorizontal: space(4),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ flex: 1, color: colors.foreground, fontWeight: "800" }} numberOfLines={1}>
              {selectedExercise
                ? translate(locale, selectedExercise.name, selectedExercise.name)
                : t("Sin ejercicios registrados", "No exercises recorded")}
            </Text>
            <Text style={{ color: colors.accent }}>▾</Text>
          </Pressable>
          <Label muted>{t("Métrica", "Metric")}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
            {(
              [
                ["weight", `${t("Carga máxima", "Maximum load")} (${unit})`],
                ["reps", t("Repeticiones", "Repetitions")],
                ["volume", `${t("Volumen", "Volume")} (${unit})`],
                ["seconds", `${t("Tiempo", "Time")} (s)`],
              ] as const
            ).map(([id, label]) => (
              <Pill key={id} label={label} active={metric === id} onPress={() => setMetric(id)} />
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}>
            <Switch
              value={warmups}
              onValueChange={setWarmups}
              trackColor={{ true: "#22c55e", false: colors.border }}
              accessibilityLabel={t("Incluir calentamientos", "Include warm-ups")}
            />
            <Label>{t("Incluir calentamientos", "Include warm-ups")}</Label>
          </View>
          <ProgressChart
            key={`${selectedId}-${metric}-${period}-${anchor.getTime()}`}
            points={points}
            unit={metric === "weight" || metric === "volume" ? unit : metric === "seconds" ? "s" : ""}
          />
          <Text style={heading}>{t("Récords personales", "Personal records")}</Text>
          <Label muted>
            {t(
              "Mejores marcas históricas logradas en el período elegido. No incluye calentamientos.",
              "All-time best performances achieved in the selected period. Warm-ups excluded.",
            )}
          </Label>
          {bestRecords.length ? (
            bestRecords.map((record, index) => (
              <View
                key={index}
                style={{
                  padding: space(3),
                  borderRadius: 16,
                  borderColor: colors.border,
                  borderWidth: 1,
                  backgroundColor: "#0b0e14",
                  gap: 2,
                }}
              >
                <Text style={{ color: colors.warning, fontWeight: "800" }}>
                  🏆{" "}
                  {record.kind === "weight"
                    ? t("Mayor peso", "Highest weight")
                    : record.metric === "seconds"
                      ? t("Mayor tiempo", "Longest hold")
                      : t("Más repeticiones", "Most repetitions")}
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>
                  {formatSet(record.weight, record.quantity, record.metric)}
                </Text>
                <Label muted>{new Date(record.date).toLocaleDateString(locale)}</Label>
              </View>
            ))
          ) : (
            <Label muted>
              {t(
                "No hay mejores marcas históricas en este período.",
                "No all-time best performances in this period.",
              )}
            </Label>
          )}
          <Text style={heading}>{t("Historial de entrenamientos", "Workout history")}</Text>
          {[...history].reverse().map((record, index) => (
            <View
              key={index}
              style={{
                padding: space(3),
                borderRadius: 14,
                backgroundColor: index % 2 ? "#13171f" : colors.secondary,
                gap: 2,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                {record.date.toLocaleDateString(locale)}
              </Text>
              <Label muted>
                {record.sets.map((set) => formatSet(set.kg, set.value, set.metric)).join(" · ")}
              </Label>
            </View>
          ))}
          {selectedExercise && !history.length ? (
            <Label muted>
              {t(
                "No hay registros de este ejercicio en el período elegido.",
                "No entries for this exercise in the selected period.",
              )}
            </Label>
          ) : null}
        </Card>
      ) : null}
      {tab === "body" ? <BodyPanel /> : null}
      <Modal
        visible={picking}
        transparent
        animationType="fade"
        onRequestClose={() => setPicking(false)}
      >
        <Pressable
          onPress={() => setPicking(false)}
          style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "85%" }}>
            <Card>
              <Text style={{ ...heading, textAlign: "center" }}>
                {t("Elegí un ejercicio", "Choose an exercise")}
              </Text>
              <ScrollView
 showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
                {recorded.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant={exercise.id === selectedId ? "primary" : "secondary"}
                    onPress={() => {
                      setSelected(exercise.id);
                      setPicking(false);
                    }}
                  >
                    {translate(locale, exercise.name, exercise.name)}
                  </Button>
                ))}
                {!recorded.length ? (
                  <Label muted>{t("Sin ejercicios registrados", "No exercises recorded")}</Label>
                ) : null}
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
