import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Switch, Text, View } from "react-native";
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
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
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
  const [restEnd, setRestEnd] = useState(0);
  const [typeFor, setTypeFor] = useState<{ entry: number; set: number } | null>(
    null,
  );
  const [replacing, setReplacing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const workout = snapshot.workout;
  if (!workout) return <Redirect href="/" />;
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const types = localizedSetTypes(language);
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
          { ...emptyExtras, comment: comment.trim() },
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
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>{day?.name ?? t("Entrenamiento", "Workout")}</Title>
        <SyncStatus />
      </View>
      <Notice />
      {restEnd > Date.now() ? (
        <RestBanner end={restEnd} onStop={() => setRestEnd(0)} />
      ) : null}
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
        return (
          <Card key={`${entry.id}-${index}`}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {exercise
                ? translate(language, exercise.name, exercise.name)
                : entry.id}
            </Text>
            {entry.superset ? (
              <Label muted>{t("Superserie", "Superset")}</Label>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space(2),
              }}
            >
              <Label muted>{t("Rep", "Reps")}</Label>
              <Switch
                accessibilityLabel={t("Registrar por tiempo", "Track by time")}
                value={metric === "seconds"}
                trackColor={{ true: colors.primary, false: colors.secondary }}
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
              <Label muted>{t("Tiempo", "Time")}</Label>
              <View style={{ flex: 1 }} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setRestEnd(Date.now() + restSeconds * 1000)}
                hitSlop={8}
              >
                <Text style={{ color: colors.accent }}>⏱ {restSeconds}s</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: space(2) }}>
              <Label muted style={{ width: 40 }}>
                #
              </Label>
              <Label muted style={{ flex: 1.2 }}>
                {t("Anterior", "Previous")}
              </Label>
              <Label muted style={{ flex: 1, textAlign: "center" }}>
                {unit}
              </Label>
              <Label muted style={{ flex: 1, textAlign: "center" }}>
                {metric === "seconds" ? t("Seg", "Sec") : t("Rep", "Reps")}
              </Label>
            </View>
            {entry.sets.map((set, number) => {
              const old = previous[number];
              const type = types.find((item) => item.id === set.type);
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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t("Tipo de serie", "Set type")} ${number + 1}: ${type?.name ?? types[1]!.name}`}
                    onPress={() => setTypeFor({ entry: index, set: number })}
                    style={{ width: 40, alignItems: "center" }}
                  >
                    <Text
                      style={{
                        color: record ? colors.warning : colors.accent,
                        fontWeight: "800",
                      }}
                    >
                      {record
                        ? "🏆"
                        : set.type && set.type !== "normal"
                          ? type?.letter
                          : setNumber(entry.sets, number)}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t("Usar datos anteriores", "Use previous values")} ${number + 1}`}
                    disabled={!old}
                    style={{ flex: 1.2 }}
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
                    <Label muted>
                      {old ? `${old.kg} × ${old.value}` : "—"}
                    </Label>
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
                        current.entered = value !== null || current.kg != null;
                      })
                    }
                  />
                </View>
              );
            })}
            <View style={{ flexDirection: "row", gap: space(2) }}>
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
              <View style={{ flex: 1 }}>
                <Button
                  variant="ghost"
                  disabled={entry.sets.length <= 1}
                  onPress={() =>
                    editEntry(index, (draft) => void draft.sets.pop())
                  }
                >
                  {t("− Serie", "− Set")}
                </Button>
              </View>
            </View>
            <Field
              label={t("Nota", "Note")}
              defaultValue={entry.note ?? ""}
              maxLength={500}
              onEndEditing={(event) => {
                const note = event.nativeEvent.text.trim();
                if (note !== (entry.note ?? ""))
                  editEntry(index, (draft) => void (draft.note = note));
              }}
            />
            <Button variant="ghost" onPress={() => setReplacing(index)}>
              {t("Reemplazar ejercicio", "Replace exercise")}
            </Button>
          </Card>
        );
      })}
      <Button variant="secondary" onPress={() => setAdding(true)}>
        {t("+ Agregar ejercicio", "+ Add exercise")}
      </Button>
      <Field
        label={t("Comentario (opcional)", "Comment (optional)")}
        value={comment}
        onChangeText={setComment}
        maxLength={2000}
        multiline
      />
      <Button onPress={finish}>
        {t("Guardar entrenamiento", "Save workout")}
      </Button>
      <Button variant="ghost" onPress={cancel}>
        {t("Cancelar entrenamiento", "Cancel workout")}
      </Button>
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
