import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { translate } from "@fitty/core/data/translations";
import {
  blankSet,
  buildSession,
  color as sessionColor,
  findExercise,
  metricFor,
  type Entry,
  type Extras,
  type Session,
} from "@fitty/core/domain/workouts";
import { EntryCard } from "@/components/entry-card";
import { SetTypeDialog } from "@/components/set-type-dialog";
import { SessionExtras } from "@/components/session-extras";
import { Button, Card, Field, Label, DialogScroll } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Edits a saved workout: names, every set, notes, color, comment and photos. */
export function SessionEditor({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const [state, setState] = useState<{
    id: string;
    names: { routine: string; day: string };
    entries: Entry[];
    extras: Extras;
  } | null>(null);
  const [resizing, setResizing] = useState(false);
  const [open, setOpen] = useState<number[]>([0]);
  const [typeFor, setTypeFor] = useState<{ entry: number; set: number } | null>(null);
  // Load the draft whenever a different session is opened.
  if (session && state?.id !== session.id) {
    const factor =
      (session.weightUnit ?? "kg") === unit
        ? 1
        : unit === "lb"
          ? 2.20462
          : 1 / 2.20462;
    setState({
      id: session.id,
      names: { routine: session.routine, day: session.day },
      entries:
        session.exercises?.map((exercise) => ({
          id: exercise.id,
          note: exercise.note ?? "",
          tracking: exercise.performedSets?.some((set) => Number(set.seconds) > 0)
            ? "seconds"
            : metricFor(snapshot, exercise.id),
          sets: exercise.performedSets?.length
            ? exercise.performedSets.map((set) => ({
                ...set,
                kg:
                  factor === 1
                    ? (set.kg ?? 0)
                    : Math.round((Number(set.kg) || 0) * factor * 10) / 10,
                entered: true,
              }))
            : [blankSet(metricFor(snapshot, exercise.id))],
        })) ?? [],
      extras: {
        ...(session.rating
          ? { rating: session.rating as NonNullable<Extras["rating"]> }
          : {}),
        color: sessionColor(session.color),
        comment: session.comment ?? "",
        photos: session.photos ?? [],
        bodyWeightStartKg: session.bodyWeightStartKg ?? null,
        bodyWeightEndKg: session.bodyWeightEndKg ?? null,
      },
    });
  }
  const close = () => {
    setState(null);
    onClose();
  };
  const save = () => {
    if (!session || !state) return;
    try {
      let saved = false;
      saved = change((draft) => {
        const old = draft.sessions.find((item) => item.id === session.id);
        if (!old) return;
        const next = buildSession(
          draft,
          state.entries,
          state.names,
          old.date,
          { ...state.extras, comment: state.extras.comment.trim() },
          true,
        );
        next.exercises = next.exercises?.map((exercise, index) => ({
          ...(old.exercises?.[index]?.id === exercise.id
            ? old.exercises[index]
            : old.exercises?.find((item) => item.id === exercise.id)),
          ...exercise,
        }));
        Object.assign(old, next, {
          id: old.id,
          duration: old.duration,
          date: old.date,
          dateOnly: old.dateOnly,
          manual: old.manual,
        });
        draft.sessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      });
      if (saved) {
        notify(t("Entrenamiento actualizado", "Workout updated"));
        close();
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  };
  const setEntry = (index: number, edit: (entry: Entry) => void) =>
    setState((current) => {
      if (!current) return current;
      const entries = structuredClone(current.entries);
      const entry = entries[index];
      if (entry) edit(entry);
      return { ...current, entries };
    });
  return (
    <Modal visible={session !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={close}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "94%" }}>
          <Card>
            <Text
              accessibilityRole="header"
              style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}
            >
              {t("Editar entrenamiento", "Edit workout")}
            </Text>
            <DialogScroll
              scrollEnabled={!resizing}
              contentContainerStyle={{ gap: space(3) }}
            >
              {state ? (
                <>
                  <Field
                    label={t("Rutina", "Routine")}
                    value={state.names.routine}
                    onChangeText={(routine) =>
                      setState({ ...state, names: { ...state.names, routine } })
                    }
                    maxLength={80}
                  />
                  <Field
                    label={t("Día", "Day")}
                    value={state.names.day}
                    onChangeText={(day) =>
                      setState({ ...state, names: { ...state.names, day } })
                    }
                    maxLength={80}
                  />
                  {state.entries.map((entry, index) => (
                    <EntryCard
                      key={`${entry.id}-${index}`}
                      entry={entry}
                      exercise={findExercise(snapshot, entry.id)}
                      expanded={open.includes(index)}
                      onToggle={() =>
                        setOpen((current) =>
                          current.includes(index)
                            ? current.filter((item) => item !== index)
                            : [...current, index],
                        )
                      }
                      onChange={(edit) => setEntry(index, edit)}
                      onTypePress={(set) => setTypeFor({ entry: index, set })}
                    />
                  ))}
                  <SessionExtras
                    value={state.extras}
                    onChange={(extras) => setState({ ...state, extras })}
                    onResizing={setResizing}
                  />
                </>
              ) : null}
            </DialogScroll>
            <Button onPress={save}>{t("Guardar cambios", "Save changes")}</Button>
            <Button variant="secondary" onPress={close}>
              {t("Cancelar", "Cancel")}
            </Button>
          </Card>
        </View>
      </View>
      <SetTypeDialog
        visible={typeFor !== null}
        current={
          (typeFor && state?.entries[typeFor.entry]?.sets[typeFor.set]?.type) ||
          "normal"
        }
        onClose={() => setTypeFor(null)}
        onSelect={(typeId) => {
          if (!typeFor) return;
          setEntry(typeFor.entry, (draft) => {
            const current = draft.sets[typeFor.set];
            if (!current) return;
            current.type = typeId;
            if (!["drop", "pyramid"].includes(typeId)) delete current.dropGroup;
          });
          setTypeFor(null);
        }}
      />
    </Modal>
  );
}
