import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useKeepAwake } from "expo-keep-awake";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { exerciseImage } from "@fitty/core/data/exercises";
import { localizedSetTypes } from "@fitty/core/data/set-types";
import { translate } from "@fitty/core/data/translations";
import { replaceWorkoutExercise } from "@fitty/core/domain/exercise-replacement";
import { personalRecords } from "@fitty/core/domain/personal-records";
import {
  addDropSegment,
  addWorkoutExercises,
  blankSet,
  buildSession,
  emptyExtras,
  findExercise,
  metricFor,
  previousSets,
  setNumber,
  switchEntryMetric,
  type Entry,
  type Extras,
} from "@fitty/core/domain/workouts";
import { Chip } from "@/components/chip";
import { ExercisePicker } from "@/components/exercise-picker";
import { Notice } from "@/components/notice";
import { NumberInput } from "@/components/number-input";
import { SessionExtras } from "@/components/session-extras";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { env } from "@/lib/env";
import { makeId } from "@/lib/id";
import { playRestDone } from "@/lib/sound";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, radius, space } from "@/theme";

const pad = (value: number) => String(value).padStart(2, "0");
const typeColor: Record<string, string> = {
  warmup: "#facc15",
  normal: "#4ade80",
  failure: "#fb7185",
  drop: "#38bdf8",
  pyramid: "#c084fc",
};

function typeHelp(id: string, t: (es: string, en: string) => string) {
  switch (id) {
    case "warmup":
      return t(
        "Usá una carga liviana para preparar el movimiento y practicar la técnica antes de las series de trabajo, sin agotarte.",
        "Use a light load to prepare the movement and practice technique before working sets, without tiring yourself out.",
      );
    case "failure":
      return t(
        "Llegás al límite de repeticiones que podés completar con buena técnica. Registrá solo las repeticiones completas y no fuerces una repetición insegura; usá asistencia o protecciones si corresponde.",
        "Reach the limit of repetitions you can complete with good form. Log completed repetitions only; do not force an unsafe repetition. Use a spotter or safety equipment when appropriate.",
      );
    case "drop":
      return t(
        "Empezá con una carga que permita unas 8–12 repeticiones con buena técnica, no con tu peso máximo. Al llegar al fallo técnico, reducí un 20–25% del peso que estás usando y continuá con poco descanso. Podés hacer 1–3 bajadas. Registrá cada tramo por separado.",
        "Start with a load you can lift for about 8–12 controlled repetitions, not your maximum weight. At technical failure, reduce the current load by 20–25% and continue with little rest. Use 1–3 drops. Log each segment separately.",
      );
    case "pyramid":
      return t(
        "Subí el peso en cada tramo y luego bajalo. Por ejemplo: 20 → 25 → 30 → 25 → 20 kg. Registrá el peso y las repeticiones de cada tramo por separado.",
        "Increase the weight in each segment, then decrease it. For example: 20 → 25 → 30 → 25 → 20 kg. Log weight and repetitions for each segment separately.",
      );
    default:
      return t(
        "Realizá las repeticiones previstas con una carga adecuada y buena técnica. Descansá antes de la siguiente serie.",
        "Perform your planned repetitions with an appropriate load and good technique. Rest before the next set.",
      );
  }
}

/** Rest countdown shared by every exercise in the workout. */
function RestBanner({ end, onStop }: { end: number; onStop: () => void }) {
  const { t } = useAccount();
  const [now, setNow] = useState(Date.now());
  const done = useRef(false);
  useEffect(() => {
    done.current = false;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [end]);
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  useEffect(() => {
    if (left === 0 && !done.current) {
      done.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playRestDone();
      onStop();
    }
  }, [left, onStop]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("Detener descanso", "Stop rest")}
      onPress={onStop}
      style={{
        backgroundColor: colors.primary,
        borderRadius: radius,
        padding: space(3),
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text
        style={{ color: colors.primaryForeground, fontWeight: "700", flex: 1 }}
      >
        {t("Descanso", "Rest")}
      </Text>
      <Text
        accessibilityRole="timer"
        style={{
          color: colors.primaryForeground,
          fontSize: 22,
          fontWeight: "800",
          fontVariant: ["tabular-nums"],
        }}
      >
        {pad(Math.floor(left / 60))}:{pad(left % 60)}
      </Text>
    </Pressable>
  );
}

export default function Workout() {
  useKeepAwake();
  const snapshot = useSnapshot();
  const { change, t, notify } = useAccount();
  const router = useRouter();
  const [extras, setExtras] = useState<Extras>(emptyExtras);
  const [restEnd, setRestEnd] = useState(0);
  const [typeFor, setTypeFor] = useState<{ entry: number; set: number } | null>(
    null,
  );
  const [replacing, setReplacing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [supersetOpen, setSupersetOpen] = useState(false);
  const [members, setMembers] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [imageFor, setImageFor] = useState<ReturnType<typeof findExercise> | null>(null);
  const workout = snapshot.workout;
  if (!workout) return <Redirect href="/" />;
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const types = localizedSetTypes(language);
  const settings = snapshot.settings;
  const restSeconds = Math.max(
    5,
    Math.min(3600, Number(snapshot.settings.restSeconds) || 60),
  );
  const routine = snapshot.routines.find((item) => item.id === workout.rid);
  const day = routine?.days.find((item) => item.id === workout.did);
  const editEntry = (index: number, edit: (entry: Entry) => void) =>
    change((draft) => {
      const entry = draft.workout?.entries[index];
      if (entry) edit(entry);
    });
  const finish = () => {
    if (
      change((draft) => {
        if (!draft.workout) return;
        const record = buildSession(
          draft,
          draft.workout.entries,
          {
            routine: routine?.name ?? "Rutina",
            day: day?.name ?? t("Entrenamiento", "Workout"),
          },
          new Date().toISOString(),
          { ...extras, comment: extras.comment.trim() },
        );
        record.duration = Math.max(
          0,
          Math.round((Date.now() - draft.workout.started) / 60000),
        );
        draft.sessions.unshift(record);
        draft.workout = null;
      })
    ) {
      notify(t("Entrenamiento guardado", "Workout saved"));
      router.replace("/");
    }
  };
  const cancel = () =>
    Alert.alert(
      t("Cancelar entrenamiento", "Cancel workout"),
      t("No se guardará este entrenamiento.", "This workout won't be saved."),
      [
        { text: t("Volver", "Back"), style: "cancel" },
        {
          text: t("Cancelar entrenamiento", "Cancel workout"),
          style: "destructive",
          onPress: () => {
            if (change((draft) => void (draft.workout = null)))
              router.replace("/");
          },
        },
      ],
    );
  const selected = typeFor
    ? workout.entries[typeFor.entry]?.sets[typeFor.set]
    : undefined;
  const open = (index: number) =>
    workout.openExercises?.includes(index) ?? index === 0;
  const restEnabled = settings.restEnabled === true;
  return (
    <Screen>
      <View
        style={{
          borderRadius: 24,
          borderColor: "#2b6a8f",
          borderWidth: 1,
          backgroundColor: "#10283a",
          padding: space(5),
          gap: space(2),
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {day?.name ?? t("Entrenamiento", "Workout")} · {workout.index + 1}/
          {workout.entries.length}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>
          {routine?.name ?? t("Tu entrenamiento", "Your workout")}
        </Text>
      </View>
      <Notice />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" onPress={() => setAdding(true)}>
            {t("Agregar ejercicios", "Add exercises")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            onPress={() => {
              setMembers([]);
              setSupersetOpen(true);
            }}
          >
            {t("Superseries", "Supersets")}
          </Button>
        </View>
      </View>
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space(3),
          }}
        >
          <Label>{t("Descanso", "Rest")}</Label>
          <View style={{ height: 52, justifyContent: "center" }}>
            <Switch
              accessibilityLabel={t(
                "Descanso entre series",
                "Rest between sets",
              )}
              value={restEnabled}
              trackColor={{ true: "#22c55e", false: colors.border }}
              onValueChange={(checked) => {
                change((draft) => void (draft.settings.restEnabled = checked));
                if (!checked) setRestEnd(0);
              }}
            />
          </View>
          <View style={{ width: 84 }}>
            <NumberInput
              value={restSeconds}
              accessibilityLabel={t("Segundos", "Seconds")}
              onCommit={(value) =>
                change(
                  (draft) =>
                    void (draft.settings.restSeconds = Math.max(
                      5,
                      Math.min(3600, value ?? 60),
                    )),
                )
              }
            />
          </View>
          <Label>{t("segundos", "seconds")}</Label>
        </View>
        {restEnd > Date.now() ? (
          <RestBanner end={restEnd} onStop={() => setRestEnd(0)} />
        ) : null}
      </Card>
      {workout.entries.map((entry, index) => {
        const exercise = findExercise(snapshot, entry.id);
        const metric = metricFor(snapshot, entry.id, entry);
        const previous = previousSets(
          snapshot,
          entry.id,
          metric,
          workout.started,
        );
        const records = personalRecords(
          snapshot,
          entry.id,
          entry.sets,
          unit,
          workout.started,
          undefined,
          metric,
        );
        const expanded = open(index);
        return (
          <Card key={`${entry.id}-${index}`}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() =>
                change((draft) => {
                  const current = draft.workout;
                  if (!current) return;
                  const list = current.openExercises ?? [0];
                  current.openExercises = expanded
                    ? list.filter((number) => number !== index)
                    : [...new Set([...list, index])];
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space(3),
              }}
            >
              {exercise ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t("Ampliar", "Enlarge")} ${exercise.name}`}
                  onPress={() => setImageFor(exercise)}
                >
                  <Image
                    source={`${env.apiUrl}${exerciseImage(exercise, snapshot.profile.gender)}`}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      backgroundColor: "#0d1016",
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                    accessibilityIgnoresInvertColors
                  />
                </Pressable>
              ) : null}
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 17,
                    fontWeight: "800",
                  }}
                >
                  {exercise
                    ? translate(language, exercise.name, exercise.name)
                    : entry.id}
                </Text>
                <Label muted>
                  {entry.superset ? `${t("Superserie", "Superset")} · ` : ""}
                  {entry.sets.length} {t("series", "sets")}
                </Label>
              </View>
              <SymbolView
                name={
                  expanded
                    ? { ios: "chevron.up", android: "expand_less" }
                    : { ios: "chevron.down", android: "expand_more" }
                }
                tintColor={colors.muted}
                size={16}
              />
            </Pressable>
            {expanded ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space(3),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      onPress={() => setReplacing(index)}
                    >
                      {t("Reemplazar\nejercicio", "Replace\nexercise")}
                    </Button>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: space(2),
                      borderRadius: 16,
                      borderColor: colors.border,
                      borderWidth: 1,
                      paddingHorizontal: space(2.5),
                      height: 52,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {t("Rep", "Reps")}
                    </Text>
                    <View style={{ height: 52, justifyContent: "center" }}>
                      <Switch
                        accessibilityLabel={t(
                          "Registrar por tiempo",
                          "Track by time",
                        )}
                        value={metric === "seconds"}
                        trackColor={{
                          true: colors.primary,
                          false: colors.border,
                        }}
                        onValueChange={(checked) => {
                          const next = checked ? "seconds" : "reps";
                          change((draft) => {
                            const target = draft.workout?.entries[index];
                            if (target) switchEntryMetric(target, metric, next);
                            draft.settings.exerciseMetrics = {
                              ...draft.settings.exerciseMetrics,
                              [entry.id]: next,
                            };
                          });
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {t("Temp", "Time")}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: space(2) }}>
                  <Label muted style={{ width: 72, textAlign: "center" }}>
                    {t("Serie", "Set")}
                  </Label>
                  <Label muted style={{ flex: 1.3, textAlign: "center" }}>
                    {t("Anterior", "Previous")}
                  </Label>
                  <Label muted style={{ flex: 1, textAlign: "center" }}>
                    {unit}
                  </Label>
                  <Label muted style={{ flex: 1, textAlign: "center" }}>
                    {metric === "seconds" ? t("Seg", "Sec") : t("Rep", "Reps")}
                  </Label>
                  <Label muted style={{ width: 44, textAlign: "center" }}>
                    {t("Tipo", "Type")}
                  </Label>
                </View>
                {entry.sets.map((set, number) => {
                  const old = previous[number];
                  const type =
                    types.find((item) => item.id === (set.type ?? "normal")) ??
                    types[0];
                  const record = records[number]?.length;
                  return (
                    <View
                      key={number}
                      style={{
                        flexDirection: "row",
                        gap: space(2),
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 72,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: record ? colors.warning : colors.foreground,
                            fontSize: 17,
                            fontWeight: "800",
                          }}
                        >
                          {record ? "🏆" : setNumber(entry.sets, number)}
                        </Text>
                        {restEnabled &&
                        (!set.dropGroup ||
                          entry.sets[number + 1]?.dropGroup !==
                            set.dropGroup) ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${t("Iniciar descanso", "Start rest")} ${number + 1}`}
                            onPress={() => {
                              editEntry(index, (draft) => {
                                const current = draft.sets[number];
                                if (current) current.restUsed = true;
                              });
                              setRestEnd(Date.now() + restSeconds * 1000);
                            }}
                            hitSlop={6}
                            style={{
                              width: 30,
                              height: 26,
                              borderRadius: 8,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor:
                                set.restUsed === true
                                  ? "#4ade801c"
                                  : colors.secondary,
                            }}
                          >
                            <SymbolView
                              name={{ ios: "timer", android: "timer" }}
                              tintColor={
                                set.restUsed === true
                                  ? colors.success
                                  : colors.muted
                              }
                              size={15}
                            />
                          </Pressable>
                        ) : null}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t("Usar datos anteriores", "Use previous values")} ${number + 1}`}
                        disabled={!old}
                        style={{
                          flex: 1.3,
                          minHeight: 52,
                          borderRadius: 14,
                          borderColor: colors.border,
                          borderWidth: 1,
                          backgroundColor: colors.secondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onPress={() =>
                          old &&
                          editEntry(index, (draft) => {
                            const current = draft.sets[number];
                            if (!current) return;
                            current.kg = old.kg;
                            current.type = old.type ?? "normal";
                            current[metric] = old.value;
                            current.entered = true;
                          })
                        }
                      >
                        {old ? (
                          <>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontWeight: "800",
                              }}
                            >
                              {old.kg} {unit}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 11 }}>
                              × {old.value}{" "}
                              {metric === "seconds"
                                ? t("seg", "sec")
                                : t("reps", "reps")}
                            </Text>
                          </>
                        ) : (
                          <Text style={{ color: colors.muted }}>—</Text>
                        )}
                      </Pressable>
                      <NumberInput
                        decimal
                        value={set.kg}
                        accessibilityLabel={`${t("Peso", "Weight")} ${number + 1}`}
                        onCommit={(value) =>
                          editEntry(index, (draft) => {
                            const current = draft.sets[number];
                            if (!current) return;
                            current.kg = value;
                            current.entered =
                              value !== null || current[metric] != null;
                          })
                        }
                      />
                      <NumberInput
                        value={set[metric]}
                        accessibilityLabel={`${metric === "seconds" ? t("Segundos", "Seconds") : t("Repeticiones", "Repetitions")} ${number + 1}`}
                        onCommit={(value) =>
                          editEntry(index, (draft) => {
                            const current = draft.sets[number];
                            if (!current) return;
                            current[metric] = value;
                            current.entered =
                              value !== null || current.kg != null;
                          })
                        }
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t("Tipo de serie", "Set type")} ${number + 1}: ${type?.name ?? ""}`}
                        onPress={() => setTypeFor({ entry: index, set: number })}
                        style={{
                          width: 44,
                          minHeight: 52,
                          borderRadius: 14,
                          borderColor: colors.border,
                          borderWidth: 1,
                          backgroundColor: colors.secondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: typeColor[type?.id ?? "normal"],
                            fontSize: 17,
                            fontWeight: "800",
                          }}
                        >
                          {type?.letter ?? "N"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
                <View style={{ flexDirection: "row", gap: space(3) }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      disabled={entry.sets.length <= 1}
                      onPress={() =>
                        editEntry(index, (draft) => void draft.sets.pop())
                      }
                    >
                      {t("− Serie", "− Set")}
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      onPress={() =>
                        editEntry(
                          index,
                          (draft) => void draft.sets.push(blankSet(metric)),
                        )
                      }
                    >
                      {t("+ Serie", "+ Set")}
                    </Button>
                  </View>
                </View>
                <Field
                  label={t("Nota de este ejercicio", "Note for this exercise")}
                  defaultValue={entry.note ?? ""}
                  maxLength={500}
                  multiline
                  onEndEditing={(event) => {
                    const note = event.nativeEvent.text.trim();
                    if (note !== (entry.note ?? ""))
                      editEntry(index, (draft) => void (draft.note = note));
                  }}
                />
              </>
            ) : null}
          </Card>
        );
      })}
      <Button onPress={() => setFinishing(true)}>
        {t("Finalizar entrenamiento", "Finish workout")}
      </Button>
      <Button variant="destructive" onPress={cancel}>
        {t("Cancelar entrenamiento", "Cancel workout")}
      </Button>
      <Modal
        visible={finishing}
        transparent
        animationType="fade"
        onRequestClose={() => setFinishing(false)}
      >
        <Pressable
          onPress={() => setFinishing(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                {t("Finalizar entrenamiento", "Finish workout")}
              </Text>
              <ScrollView
                style={{ maxHeight: 460 }}
                keyboardShouldPersistTaps="handled"
              >
                <SessionExtras value={extras} onChange={setExtras} />
              </ScrollView>
              <Button
                onPress={() => {
                  setFinishing(false);
                  finish();
                }}
              >
                {t("Guardar entrenamiento", "Save workout")}
              </Button>
              <Button variant="ghost" onPress={() => setFinishing(false)}>
                {t("Seguir entrenando", "Keep training")}
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={typeFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeFor(null)}
      >
        <Pressable
          onPress={() => setTypeFor(null)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "90%" }}>
            <Card>
              <ScrollView contentContainerStyle={{ gap: space(3) }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("Volver", "Back")}
                    onPress={() => setTypeFor(null)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: 22,
                        fontWeight: "800",
                        lineHeight: 26,
                      }}
                    >
                      ‹
                    </Text>
                  </Pressable>
                  <Text
                    accessibilityRole="header"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      color: colors.foreground,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {t("Tipo de serie", "Set type")}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      "Ayuda sobre tipos de serie",
                      "Help with set types",
                    )}
                    accessibilityState={{ expanded: showHelp }}
                    onPress={() => setShowHelp((current) => !current)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: showHelp ? colors.primary : colors.secondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: showHelp
                          ? colors.primaryForeground
                          : colors.accent,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      ?
                    </Text>
                  </Pressable>
                </View>
                {types.map((type) => (
                  <View key={type.id} style={{ gap: space(2) }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: (selected?.type ?? "normal") === type.id,
                      }}
                      onPress={() => {
                        if (!typeFor) return;
                        editEntry(typeFor.entry, (draft) => {
                          const current = draft.sets[typeFor.set];
                          if (!current) return;
                          current.type = type.id;
                          if (!["drop", "pyramid"].includes(type.id))
                            delete current.dropGroup;
                        });
                        setTypeFor(null);
                      }}
                      style={{
                        minHeight: 52,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: space(3),
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor:
                          (selected?.type ?? "normal") === type.id
                            ? typeColor[type.id]
                            : colors.border,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <Text
                        style={{
                          color: typeColor[type.id],
                          fontSize: 18,
                          fontWeight: "800",
                        }}
                      >
                        {type.letter}
                      </Text>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: 16,
                          fontWeight: "800",
                        }}
                      >
                        {type.name}
                      </Text>
                    </Pressable>
                    {showHelp ? (
                      <Label muted>{typeHelp(type.id, t)}</Label>
                    ) : null}
                  </View>
                ))}
                {selected && ["drop", "pyramid"].includes(selected.type ?? "") ? (
                  <Button
                    variant="secondary"
                    onPress={() => {
                      if (!typeFor) return;
                      const entry = workout.entries[typeFor.entry];
                      if (!entry) return;
                      editEntry(typeFor.entry, (draft) =>
                        addDropSegment(
                          draft,
                          typeFor.set,
                          metricFor(snapshot, entry.id, entry),
                        ),
                      );
                      setTypeFor(null);
                    }}
                  >
                    {t("+ Agregar descenso", "+ Add drop")}
                  </Button>
                ) : null}
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={supersetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSupersetOpen(false)}
      >
        <Pressable
          onPress={() => setSupersetOpen(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "90%" }}>
            <Card>
              <ScrollView contentContainerStyle={{ gap: space(3) }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: colors.foreground,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {t("Superseries", "Supersets")}
                </Text>
                {workout.entries.map((entry, index) => {
                  const exercise = findExercise(snapshot, entry.id);
                  return (
                    <Chip
                      key={index}
                      role="checkbox"
                      active={members.includes(index)}
                      label={
                        exercise
                          ? translate(language, exercise.name, exercise.name)
                          : entry.id
                      }
                      onPress={() =>
                        setMembers((current) =>
                          current.includes(index)
                            ? current.filter((item) => item !== index)
                            : [...current, index],
                        )
                      }
                    />
                  );
                })}
                <Button
                  disabled={members.length < 2}
                  onPress={() => {
                    change((draft) => {
                      const key = makeId();
                      draft.workout?.entries.forEach((entry, index) => {
                        if (members.includes(index)) entry.superset = key;
                      });
                    });
                    setSupersetOpen(false);
                  }}
                >
                  {t("Crear superserie", "Create superset")}
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => {
                    change((draft) => {
                      draft.workout?.entries.forEach((entry) => {
                        delete entry.superset;
                      });
                    });
                    setSupersetOpen(false);
                  }}
                >
                  {t("Quitar superseries", "Remove supersets")}
                </Button>
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={imageFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setImageFor(null)}
      >
        <Pressable
          onPress={() => setImageFor(null)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "90%" }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <ScrollView contentContainerStyle={{ gap: space(3) }}>
                {imageFor ? (
                  <Image
                    source={`${env.apiUrl}${exerciseImage(imageFor, snapshot.profile.gender)}`}
                    style={{
                      width: "100%",
                      aspectRatio: 3 / 2,
                      backgroundColor: "#0d1016",
                    }}
                    contentFit="contain"
                    cachePolicy="disk"
                    accessibilityIgnoresInvertColors
                  />
                ) : null}
                <View style={{ padding: space(4), gap: space(3) }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {imageFor
                      ? translate(language, imageFor.name, imageFor.name)
                      : ""}
                  </Text>
                  {imageFor ? (
                    <Label muted>
                      {translate(language, imageFor.group, imageFor.group)} ·{" "}
                      {translate(language, imageFor.equipment, imageFor.equipment)}
                    </Label>
                  ) : null}
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 17,
                      fontWeight: "800",
                    }}
                  >
                    {t("Técnica", "Technique")}
                  </Text>
                  {imageFor?.steps.map((step, index) => (
                    <Label key={index} muted>
                      {index + 1}. {translate(language, step, step)}
                    </Label>
                  ))}
                  <Button variant="secondary" onPress={() => setImageFor(null)}>
                    {t("Cerrar", "Close")}
                  </Button>
                </View>
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <ExercisePicker
        visible={adding}
        onClose={() => setAdding(false)}
        onPick={(ids) => change((draft) => addWorkoutExercises(draft, ids))}
      />
      <ExercisePicker
        single
        title={t("Reemplazar ejercicio", "Replace exercise")}
        visible={replacing !== null}
        onClose={() => setReplacing(null)}
        onPick={([id]) => {
          if (replacing !== null && id)
            change((draft) => replaceWorkoutExercise(draft, replacing, id));
        }}
      />
    </Screen>
  );
}
