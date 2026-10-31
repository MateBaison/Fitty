import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useKeepAwake } from "expo-keep-awake";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Switch, Text, View } from "react-native";
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
} from "@fitty/core/domain/workouts";
import { ExercisePicker } from "@/components/exercise-picker";
import { Notice } from "@/components/notice";
import { NumberInput } from "@/components/number-input";
import { PhotoStrip } from "@/components/photo-strip";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, radius, space } from "@/theme";

const pad = (value: number) => String(value).padStart(2, "0");

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
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [restEnd, setRestEnd] = useState(0);
  const [typeFor, setTypeFor] = useState<{ entry: number; set: number } | null>(
    null,
  );
  const [replacing, setReplacing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(false);
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
          { ...emptyExtras, comment: comment.trim(), photos },
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
          {t("Tu entrenamiento", "Your workout")}
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
            onPress={() =>
              change((draft) => {
                if (!draft.workout) return;
                const all =
                  draft.workout.openExercises?.length ===
                  draft.workout.entries.length;
                draft.workout.openExercises = all
                  ? []
                  : draft.workout.entries.map((_, index) => index);
              })
            }
          >
            {workout.openExercises?.length === workout.entries.length
              ? t("Cerrar todos", "Collapse all")
              : t("Desplegar todos", "Expand all")}
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
          <Switch
            accessibilityLabel={t("Descanso entre series", "Rest between sets")}
            value={restEnabled}
            trackColor={{ true: "#22c55e", false: colors.border }}
            onValueChange={(checked) => {
              change((draft) => void (draft.settings.restEnabled = checked));
              if (!checked) setRestEnd(0);
            }}
          />
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
          {restEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Iniciar descanso", "Start rest")}
              onPress={() => setRestEnd(Date.now() + restSeconds * 1000)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <SymbolView
                name={{ ios: "timer", android: "timer" }}
                tintColor={colors.accent}
                size={20}
              />
            </Pressable>
          ) : null}
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
                      {t("Reemplazar ejercicio", "Replace exercise")}
                    </Button>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space(2),
                      borderRadius: 16,
                      borderColor: colors.border,
                      borderWidth: 1,
                      paddingHorizontal: space(3),
                      minHeight: 52,
                    }}
                  >
                    <Label muted>{t("Rep", "Reps")}</Label>
                    <Switch
                      accessibilityLabel={t(
                        "Registrar por tiempo",
                        "Track by time",
                      )}
                      value={metric === "seconds"}
                      trackColor={{ true: colors.primary, false: colors.border }}
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
                    <Label muted>{t("Temp", "Time")}</Label>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: space(2) }}>
                  <Label muted style={{ width: 44, textAlign: "center" }}>
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
                      <Text
                        style={{
                          width: 44,
                          textAlign: "center",
                          color: record ? colors.warning : colors.foreground,
                          fontSize: 17,
                          fontWeight: "800",
                        }}
                      >
                        {record ? "🏆" : setNumber(entry.sets, number)}
                      </Text>
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
                            color: colors.success,
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
                      {t("− Eliminar última serie", "− Remove last set")}
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
                      {t("+ Agregar serie", "+ Add set")}
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
              <Field
                label={t("Comentario (opcional)", "Comment (optional)")}
                value={comment}
                onChangeText={setComment}
                maxLength={2000}
                multiline
              />
              <PhotoStrip photos={photos} onChange={setPhotos} />
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
            justifyContent: "flex-end",
            backgroundColor: "#000a",
          }}
        >
          <Card style={{ margin: space(4) }}>
            <Title>{t("Tipo de serie", "Set type")}</Title>
            {types.map((type) => (
              <Button
                key={type.id}
                variant={
                  (selected?.type ?? "normal") === type.id
                    ? "primary"
                    : "secondary"
                }
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
              >
                {`${type.letter} · ${type.name}`}
              </Button>
            ))}
            {selected && ["drop", "pyramid"].includes(selected.type ?? "") ? (
              <Button
                variant="ghost"
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
          </Card>
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
