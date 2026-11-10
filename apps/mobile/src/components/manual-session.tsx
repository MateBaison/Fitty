import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { exerciseName } from "@/lib/exercise-name";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { exerciseImage } from "@fitty/core/data/exercises";
import { localizedSetTypes } from "@fitty/core/data/set-types";
import { translate } from "@fitty/core/data/translations";
import {
  addDropSegment,
  blankSet,
  buildSession,
  emptyExtras,
  findExercise,
  lastSetCount,
  metricFor,
  previousSets,
  setNumber,
  switchEntryMetric,
  type Entry,
} from "@fitty/core/domain/workouts";
import { BackButton } from "@/components/back-button";
import { ExercisePicker } from "@/components/exercise-picker";
import { NumberInput } from "@/components/number-input";
import { SetTypeDialog, typeColor } from "@/components/set-type-dialog";
import {
  Button,
  Card,
  DialogScroll,
  Field,
  Label,
  styles,
} from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Same column sizes as the live workout screen. */
const columns = {
  set: { width: 48 },
  previous: { flex: 1.5, minWidth: 0 },
  load: { flex: 1, minWidth: 0 },
  amount: { flex: 1, minWidth: 0 },
  type: { width: 44 },
} as const;

type Step = "start" | "day" | "fill";

/**
 * Logs a past workout for `date` (YYYY-MM-DD). Three steps, each with a way
 * back or out: choose a routine or a custom day (floating window), choose the
 * routine's day (floating window), then fill the sets on a workout-style screen.
 */
export function ManualSession({
  date,
  visible,
  onClose,
  onSaved,
}: {
  date: string;
  visible: boolean;
  /** Leave without saving (back to the day window). */
  onClose: () => void;
  /** The workout was saved. */
  onSaved: () => void;
}) {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const types = localizedSetTypes(language);
  const [step, setStep] = useState<Step>("start");
  const [rid, setRid] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [openList, setOpenList] = useState<number[]>([0]);
  const [imageFor, setImageFor] = useState<ReturnType<typeof findExercise> | null>(null);
  const [typeFor, setTypeFor] = useState<{ entry: number; set: number } | null>(
    null,
  );
  const routine = snapshot.routines.find((item) => item.id === rid);
  const day = routine?.days.find((item) => item.id === did);
  const custom = rid === null;
  const before = Date.parse(`${date}T12:00:00`);
  const makeEntry = (id: string): Entry => ({
    id,
    tracking: metricFor(snapshot, id),
    note: "",
    sets: Array.from({ length: Math.max(1, lastSetCount(snapshot, id)) }, () =>
      blankSet(metricFor(snapshot, id)),
    ),
  });
  const reset = () => {
    setStep("start");
    setRid(null);
    setDid(null);
    setEntries([]);
    setComment("");
    setTypeFor(null);
    setOpenList([0]);
  };
  const leave = () => {
    reset();
    onClose();
  };
  const edit = (index: number, apply: (entry: Entry) => void) =>
    setEntries((current) => {
      const next = structuredClone(current);
      const entry = next[index];
      if (entry) apply(entry);
      return next;
    });
  const chooseCustom = () => {
    setRid(null);
    setDid(null);
    setEntries([]);
    setStep("fill");
  };
  const chooseRoutine = (id: string) => {
    setRid(id);
    setStep("day");
  };
  const chooseDay = (id: string) => {
    const items = routine?.days.find((item) => item.id === id)?.items ?? [];
    setDid(id);
    setEntries(items.map(makeEntry));
    setStep("fill");
  };
  const back = () => {
    if (step === "fill") {
      if (custom) setStep("start");
      else setStep("day");
      setTypeFor(null);
    } else if (step === "day") {
      setRid(null);
      setStep("start");
    }
  };
  const cancel = () => {
    if (!entries.length && !comment.trim()) return leave();
    Alert.alert(
      t("Cancelar entrenamiento", "Cancel workout"),
      t("No se guardará este entrenamiento.", "This workout won't be saved."),
      [
        { text: t("Volver", "Back"), style: "cancel" },
        {
          text: t("Cancelar entrenamiento", "Cancel workout"),
          style: "destructive",
          onPress: leave,
        },
      ],
    );
  };
  const save = () => {
    if (!entries.length) return;
    try {
      if (
        change((draft) => {
          draft.sessions.push(
            buildSession(
              draft,
              entries,
              {
                routine: routine?.name ?? t("Personalizado", "Custom"),
                day: day?.name ?? t("Día personalizado", "Custom day"),
              },
              new Date(`${date}T12:00:00`).toISOString(),
              { ...emptyExtras, comment: comment.trim() },
              true,
            ),
          );
          draft.sessions.sort(
            (a, b) => Date.parse(b.date) - Date.parse(a.date),
          );
        })
      ) {
        notify(t("Entrenamiento guardado", "Workout saved"));
        reset();
        onSaved();
      }
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : t("No se pudo guardar.", "Could not save."),
      );
    }
  };
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const heading = {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "800" as const,
  };
  const selectedSet = typeFor
    ? entries[typeFor.entry]?.sets[typeFor.set]
    : undefined;
  const header = (title: string, onBack: () => void) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
      <BackButton onPress={onBack} />
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={{ ...heading, flex: 1, textAlign: "center" }}
      >
        {title}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
  const dialog = (children: React.ReactNode) => (
    <Modal visible transparent animationType="fade" onRequestClose={leave}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: space(4),
          backgroundColor: "#000a",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Cancelar", "Cancel")}
          onPress={step === "day" ? back : leave}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "85%" }}>
          <Card>{children}</Card>
        </View>
      </View>
    </Modal>
  );
  if (!visible) return null;
  if (step === "start")
    return dialog(
      <>
        {header(t("Agregar entrenamiento", "Add workout"), leave)}
        <Label muted style={{ textTransform: "capitalize", textAlign: "center" }}>
          {dateLabel}
        </Label>
        <Label muted style={{ textAlign: "center" }}>
          {t(
            "Elegí una rutina o un día personalizado.",
            "Choose a routine or a custom day.",
          )}
        </Label>
        <DialogScroll contentContainerStyle={{ gap: space(2) }}>
          {snapshot.routines.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              onPress={() => chooseRoutine(item.id)}
            >
              {item.name}
            </Button>
          ))}
          <Button onPress={chooseCustom}>
            {t("Día personalizado", "Custom day")}
          </Button>
        </DialogScroll>
      </>,
    );
  if (step === "day")
    return dialog(
      <>
        {header(routine?.name ?? "", back)}
        <Label muted style={{ textAlign: "center" }}>
          {t("Elegí el día de la rutina.", "Choose the routine day.")}
        </Label>
        <DialogScroll contentContainerStyle={{ gap: space(2) }}>
          {routine?.days.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              disabled={!item.items.length}
              onPress={() => chooseDay(item.id)}
            >
              {item.name}
            </Button>
          ))}
        </DialogScroll>
      </>,
    );
  return (
    <Modal visible animationType="slide" onRequestClose={back}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              borderRadius: 24,
              borderColor: "#2b6a8f",
              borderWidth: 1,
              backgroundColor: "#10283a",
              paddingVertical: space(5),
              paddingHorizontal: space(14),
              gap: space(2),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "absolute", top: space(3), left: space(3) }}>
              <BackButton onPress={back} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Cancelar entrenamiento", "Cancel workout")}
              hitSlop={8}
              onPress={cancel}
              style={{
                position: "absolute",
                top: space(3),
                right: space(3),
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  color: colors.destructive ?? "#ef4444",
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                ✕
              </Text>
            </Pressable>
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {day?.name ?? t("Día personalizado", "Custom day")}
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {routine?.name ?? t("Agregar entrenamiento", "Add workout")}
            </Text>
            <Label muted style={{ textTransform: "capitalize" }}>
              {dateLabel}
            </Label>
          </View>
          {!entries.length ? (
            <Label muted>
              {t(
                "Todavía no agregaste ejercicios.",
                "You have not added any exercises yet.",
              )}
            </Label>
          ) : null}
          {entries.map((entry, index) => {
            const exercise = findExercise(snapshot, entry.id);
            const metric = metricFor(snapshot, entry.id, entry);
            const previous = previousSets(snapshot, entry.id, metric, before);
            const expanded = openList.includes(index);
            return (
              <Card key={`${entry.id}-${index}`}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() =>
                    setOpenList((list) =>
                      expanded
                        ? list.filter((number) => number !== index)
                        : [...new Set([...list, index])],
                    )
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}
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
                        fontWeight: "800",
                        fontSize: 17,
                      }}
                    >
                      {exercise ? exerciseName(language, exercise.name) : entry.id}
                    </Text>
                    <Label muted>
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
                    padding: 4,
                    gap: 4,
                    borderRadius: 16,
                    borderColor: colors.border,
                    borderWidth: 1,
                    backgroundColor: colors.secondary,
                  }}
                >
                  {(
                    [
                      ["reps", t("Repeticiones", "Repetitions")],
                      ["seconds", t("Tiempo", "Time")],
                    ] as const
                  ).map(([id, label]) => (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: metric === id }}
                      onPress={() => {
                        if (metric === id) return;
                        edit(index, (draft) => switchEntryMetric(draft, metric, id));
                        change((draft) => {
                          draft.settings.exerciseMetrics = {
                            ...draft.settings.exerciseMetrics,
                            [entry.id]: id,
                          };
                        });
                      }}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: metric === id ? colors.primary : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "800",
                          color:
                            metric === id ? colors.primaryForeground : colors.foreground,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  {(
                    [
                      [columns.set, t("Serie", "Set")],
                      [columns.previous, t("Anterior", "Previous")],
                      [columns.load, unit],
                      [
                        columns.amount,
                        metric === "seconds" ? t("Seg", "Sec") : t("Rep", "Reps"),
                      ],
                      [columns.type, t("Tipo", "Type")],
                    ] as const
                  ).map(([column, label], position) => (
                    <View
                      key={position}
                      style={[column, { alignItems: "center", justifyContent: "center" }]}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                        style={{
                          color: colors.muted,
                          fontSize: 14,
                          textAlign: "center",
                          alignSelf: "stretch",
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
                {entry.sets.map((set, number) => {
                  const old = previous[number];
                  const type =
                    types.find((item) => item.id === (set.type ?? "normal")) ??
                    types[0];
                  return (
                    <View
                      key={number}
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: number % 2 === 0 ? "#1b212b" : "#2b3340",
                      }}
                    >
                      <View
                        style={{
                          ...columns.set,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 17,
                            fontWeight: "800",
                          }}
                        >
                          {setNumber(entry.sets, number)}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t("Usar datos anteriores", "Use previous values")} ${number + 1}`}
                        disabled={!old}
                        style={{
                          ...columns.previous,
                          minHeight: 52,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onPress={() =>
                          old &&
                          edit(index, (draft) => {
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
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.6}
                              style={{
                                color: colors.foreground,
                                fontWeight: "800",
                                fontSize: 14,
                                paddingHorizontal: 4,
                              }}
                            >
                              {old.kg} {unit}
                            </Text>
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.7}
                              style={{
                                color: colors.muted,
                                fontSize: 11,
                                paddingHorizontal: 4,
                              }}
                            >
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
                      <View style={columns.load}>
                        <NumberInput
                          plain
                          decimal
                          value={set.kg}
                          accessibilityLabel={`${t("Peso", "Weight")} ${number + 1}`}
                          onCommit={(value) =>
                            edit(index, (draft) => {
                              const current = draft.sets[number];
                              if (!current) return;
                              current.kg = value;
                              current.entered =
                                value !== null || current[metric] != null;
                            })
                          }
                        />
                      </View>
                      <View style={columns.amount}>
                        <NumberInput
                          plain
                          value={set[metric]}
                          accessibilityLabel={`${metric === "seconds" ? t("Segundos", "Seconds") : t("Repeticiones", "Repetitions")} ${number + 1}`}
                          onCommit={(value) =>
                            edit(index, (draft) => {
                              const current = draft.sets[number];
                              if (!current) return;
                              current[metric] = value;
                              current.entered =
                                value !== null || current.kg != null;
                            })
                          }
                        />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t("Tipo de serie", "Set type")} ${number + 1}: ${type?.name ?? ""}`}
                        onPress={() => setTypeFor({ entry: index, set: number })}
                        style={{
                          ...columns.type,
                          minHeight: 52,
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
                      onPress={() => edit(index, (draft) => void draft.sets.pop())}
                    >
                      {t("− Serie", "− Set")}
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      onPress={() =>
                        edit(index, (draft) => void draft.sets.push(blankSet(metric)))
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
                      edit(index, (draft) => void (draft.note = note));
                  }}
                />
                <Button
                  variant="destructive"
                  onPress={() => {
                    setEntries((current) =>
                      current.filter((_, position) => position !== index),
                    );
                    setOpenList((list) =>
                      list
                        .filter((number) => number !== index)
                        .map((number) => (number > index ? number - 1 : number)),
                    );
                  }}
                >
                  {t("Quitar ejercicio", "Remove exercise")}
                </Button>
                  </>
                ) : null}
              </Card>
            );
          })}
          {entries.length ? (
            <Field
              label={t("Comentario (opcional)", "Comment (optional)")}
              value={comment}
              onChangeText={setComment}
              maxLength={2000}
              multiline
            />
          ) : null}
          <Button variant="secondary" onPress={() => setAdding(true)}>
            {t("Agregar ejercicios", "Add exercises")}
          </Button>
          <Button disabled={!entries.length} onPress={save}>
            {t("Guardar entrenamiento", "Save workout")}
          </Button>
        </ScrollView>
      </SafeAreaView>
      <SetTypeDialog
        visible={typeFor !== null}
        current={selectedSet?.type ?? "normal"}
        onClose={() => setTypeFor(null)}
        onSelect={(typeId) => {
          if (!typeFor) return;
          edit(typeFor.entry, (draft) => {
            const current = draft.sets[typeFor.set];
            if (!current) return;
            current.type = typeId;
            if (!["drop", "pyramid"].includes(typeId)) delete current.dropGroup;
          });
          setTypeFor(null);
        }}
        onAddDrop={() => {
          if (!typeFor) return;
          const entry = entries[typeFor.entry];
          if (!entry) return;
          edit(typeFor.entry, (draft) =>
            addDropSegment(draft, typeFor.set, metricFor(snapshot, entry.id, entry)),
          );
          setTypeFor(null);
        }}
      />
      <ExercisePicker
        visible={adding}
        onClose={() => setAdding(false)}
        onPick={(ids) => {
          setOpenList((list) => [
            ...list,
            ...ids.map((_, position) => entries.length + position),
          ]);
          setEntries((current) => [...current, ...ids.map(makeEntry)]);
        }}
      />
      <Modal
        visible={imageFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setImageFor(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Cerrar", "Close")}
            onPress={() => setImageFor(null)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View style={{ maxHeight: "90%" }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <DialogScroll flush contentContainerStyle={{ gap: space(3) }}>
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
                  <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
                    {imageFor ? exerciseName(language, imageFor.name) : ""}
                  </Text>
                  {imageFor ? (
                    <Label muted>
                      {translate(language, imageFor.group, imageFor.group)} ·{" "}
                      {translate(language, imageFor.equipment, imageFor.equipment)}
                    </Label>
                  ) : null}
                  <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }}>
                    {t("Técnica", "Technique")}
                  </Text>
                  {imageFor?.steps.map((step, number) => (
                    <Label key={number} muted>
                      {number + 1}. {translate(language, step, step)}
                    </Label>
                  ))}
                  <Button variant="secondary" onPress={() => setImageFor(null)}>
                    {t("Cerrar", "Close")}
                  </Button>
                </View>
              </DialogScroll>
            </Card>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
