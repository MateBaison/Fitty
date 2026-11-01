import { useState } from "react";
import { exerciseName } from "@/lib/exercise-name";
import { Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { translate } from "@fitty/core/data/translations";
import {
  blankSet,
  buildSession,
  emptyExtras,
  findExercise,
  lastSetCount,
  metricFor,
  type Entry,
} from "@fitty/core/domain/workouts";
import { ChipGroup } from "@/components/chip";
import { NumberInput } from "@/components/number-input";
import { Button, Card, Field, Label, styles, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Logs a past workout for `date` (YYYY-MM-DD) from one routine day. */
export function ManualSession({
  date,
  visible,
  onClose,
}: {
  date: string;
  visible: boolean;
  onClose: () => void;
}) {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const [rid, setRid] = useState<string | null>(
    snapshot.selected ?? snapshot.routines[0]?.id ?? null,
  );
  const [did, setDid] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [comment, setComment] = useState("");
  const routine = snapshot.routines.find((item) => item.id === rid);
  const day = routine?.days.find((item) => item.id === did);
  const chooseDay = (id: string) => {
    setDid(id);
    const items = routine?.days.find((item) => item.id === id)?.items ?? [];
    setEntries(
      items.map((exercise) => ({
        id: exercise,
        tracking: metricFor(snapshot, exercise),
        note: "",
        sets: Array.from({ length: lastSetCount(snapshot, exercise) }, () =>
          blankSet(metricFor(snapshot, exercise)),
        ),
      })),
    );
  };
  const setValue = (
    entry: number,
    set: number,
    field: "kg" | "reps" | "seconds",
    value: number | null,
  ) =>
    setEntries((current) =>
      current.map((item, index) =>
        index !== entry
          ? item
          : {
              ...item,
              sets: item.sets.map((row, position) =>
                position !== set
                  ? row
                  : {
                      ...row,
                      [field]: value,
                      entered: value !== null || row.entered === true,
                    },
              ),
            },
      ),
    );
  const close = () => {
    setDid(null);
    setEntries([]);
    setComment("");
    onClose();
  };
  const save = () => {
    if (!routine || !day) return;
    if (
      change((draft) => {
        draft.sessions.push(
          buildSession(
            draft,
            entries,
            { routine: routine.name, day: day.name },
            new Date(`${date}T12:00:00`).toISOString(),
            { ...emptyExtras, comment: comment.trim() },
            true,
          ),
        );
        draft.sessions.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      })
    ) {
      notify(t("Entrenamiento guardado", "Workout saved"));
      close();
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
 showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Title>{t("Registrar entrenamiento", "Log workout")}</Title>
          <Label muted>
            {new Date(`${date}T12:00:00`).toLocaleDateString(language, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Label>
          {snapshot.routines.length ? (
            <>
              <ChipGroup
                options={snapshot.routines.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                value={rid ?? ""}
                onChange={(value) => {
                  setRid(value);
                  setDid(null);
                  setEntries([]);
                }}
              />
              {routine ? (
                <ChipGroup
                  options={routine.days.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  value={did ?? ""}
                  onChange={chooseDay}
                />
              ) : null}
            </>
          ) : (
            <Label>
              {t("Primero creá una rutina.", "Create a routine first.")}
            </Label>
          )}
          {entries.map((entry, index) => {
            const exercise = findExercise(snapshot, entry.id);
            const metric = metricFor(snapshot, entry.id, entry);
            return (
              <Card key={`${entry.id}-${index}`}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: "700",
                    fontSize: 17,
                  }}
                >
                  {exercise
                    ? exerciseName(language, exercise.name)
                    : entry.id}
                </Text>
                {entry.sets.map((set, number) => (
                  <View
                    key={number}
                    style={{
                      flexDirection: "row",
                      gap: space(2),
                      alignItems: "center",
                    }}
                  >
                    <Label muted style={{ width: 24 }}>
                      {number + 1}
                    </Label>
                    <NumberInput
                      decimal
                      value={set.kg}
                      accessibilityLabel={`${t("Peso", "Weight")} (${unit}) ${number + 1}`}
                      onCommit={(value) => setValue(index, number, "kg", value)}
                    />
                    <NumberInput
                      value={set[metric]}
                      accessibilityLabel={`${metric === "seconds" ? t("Segundos", "Seconds") : t("Repeticiones", "Repetitions")} ${number + 1}`}
                      onCommit={(value) =>
                        setValue(index, number, metric, value)
                      }
                    />
                  </View>
                ))}
                <Button
                  variant="ghost"
                  onPress={() =>
                    setEntries((current) =>
                      current.map((item, position) =>
                        position === index
                          ? { ...item, sets: [...item.sets, blankSet(metric)] }
                          : item,
                      ),
                    )
                  }
                >
                  {t("+ Serie", "+ Set")}
                </Button>
              </Card>
            );
          })}
          {day ? (
            <Field
              label={t("Comentario (opcional)", "Comment (optional)")}
              value={comment}
              onChangeText={setComment}
              maxLength={2000}
              multiline
            />
          ) : null}
          <Button disabled={!day} onPress={save}>
            {t("Guardar entrenamiento", "Save workout")}
          </Button>
          <Button variant="ghost" onPress={close}>
            {t("Cancelar", "Cancel")}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
