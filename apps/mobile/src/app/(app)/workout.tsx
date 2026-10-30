import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { translate } from "@fitty/core/data/translations";
import {
  blankSet,
  buildSession,
  emptyExtras,
  findExercise,
  metricFor,
  previousSets,
  setNumber,
  type Entry,
} from "@fitty/core/domain/workouts";
import { Notice } from "@/components/notice";
import { NumberInput } from "@/components/number-input";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const setTypes = ["normal", "warmup", "failure"] as const;
const typeLetter: Record<string, string> = {
  warmup: "C",
  normal: "N",
  failure: "F",
  drop: "D",
};

export default function Workout() {
  const snapshot = useSnapshot();
  const { change, t, notify } = useAccount();
  const router = useRouter();
  const [comment, setComment] = useState("");
  const workout = snapshot.workout;
  if (!workout) return <Redirect href="/" />;
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
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
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>{day?.name ?? t("Entrenamiento", "Workout")}</Title>
        <SyncStatus />
      </View>
      <Notice />
      {workout.entries.map((entry, index) => {
        const exercise = findExercise(snapshot, entry.id);
        const metric = metricFor(snapshot, entry.id, entry);
        const previous = previousSets(
          snapshot,
          entry.id,
          metric,
          workout.started,
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
            <View style={{ flexDirection: "row", gap: space(2) }}>
              <Label muted style={{ width: 32 }}>
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
                    accessibilityLabel={`${t("Tipo de serie", "Set type")} ${number + 1}`}
                    onPress={() =>
                      editEntry(index, (draft) => {
                        const current = draft.sets[number];
                        if (!current) return;
                        const position = setTypes.indexOf(
                          (current.type ??
                            "normal") as (typeof setTypes)[number],
                        );
                        current.type =
                          setTypes[(position + 1) % setTypes.length];
                      })
                    }
                    style={{ width: 32, alignItems: "center" }}
                  >
                    <Text style={{ color: colors.accent, fontWeight: "800" }}>
                      {set.type && set.type !== "normal"
                        ? typeLetter[set.type]
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
          </Card>
        );
      })}
      <Field
        label={t("Comentario (opcional)", "Comment (optional)")}
        value={comment}
        onChangeText={setComment}
        maxLength={500}
        multiline
      />
      <Button onPress={finish}>
        {t("Guardar entrenamiento", "Save workout")}
      </Button>
      <Button variant="ghost" onPress={cancel}>
        {t("Cancelar entrenamiento", "Cancel workout")}
      </Button>
    </Screen>
  );
}
