import { useRouter } from "expo-router";
import { useState } from "react";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Alert, Modal, Pressable, Share, Switch, Text, View } from "react-native";
import { buildAutomaticRoutine } from "@fitty/core/domain/calculations/automatic-routine";
import {
  muscleGroups,
  type MuscleGroup,
} from "@fitty/core/domain/schemas/exercise";
import { encodeRoutine } from "@fitty/core/domain/sharing";
import { findExercise } from "@fitty/core/domain/workouts";
import { translate } from "@fitty/core/data/translations";
import { Chip, ChipGroup } from "@/components/chip";
import { ExercisePicker } from "@/components/exercise-picker";
import { Notice } from "@/components/notice";
import { goals } from "@/components/onboarding";
import { TextPrompt } from "@/components/prompt";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { env } from "@/lib/env";
import { makeId } from "@/lib/id";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

type Prompt =
  | { type: "rename"; rid: string; name: string }
  | { type: "day"; rid: string }
  | { type: "rename-day"; rid: string; did: string; name: string };

const symbols: Record<string, SymbolViewProps["name"]> = {
  "↑": { ios: "arrow.up", android: "arrow_upward" },
  "↓": { ios: "arrow.down", android: "arrow_downward" },
  "✎": { ios: "pencil", android: "edit" },
  "✕": { ios: "trash.fill", android: "delete" },
  share: { ios: "square.and.arrow.up", android: "share" },
};

function IconButton({
  label,
  symbol,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: danger ? colors.destructive : colors.secondary,
        borderColor: colors.border,
        borderWidth: danger ? 0 : 1,
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <SymbolView
        name={symbols[symbol] ?? symbols["✎"]!}
        tintColor={danger ? "#ffffff" : colors.accent}
        size={18}
      />
    </Pressable>
  );
}

export default function Routines() {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const router = useRouter();
  const language = snapshot.settings.language ?? "es";
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"custom" | "auto">("custom");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string>("Fuerza e hipertrofia");
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [days, setDays] = useState(3);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [superset, setSuperset] = useState<{ rid: string; did: string } | null>(
    null,
  );
  const [members, setMembers] = useState<string[]>([]);
  const [picker, setPicker] = useState<{ rid: string; did: string } | null>(
    null,
  );
  const [open, setOpen] = useState<string | null>(snapshot.selected);

  const editDay = (
    rid: string,
    did: string,
    edit: (day: (typeof snapshot.routines)[number]["days"][number]) => void,
  ) =>
    change((draft) => {
      const day = draft.routines
        .find((routine) => routine.id === rid)
        ?.days.find((item) => item.id === did);
      if (day) edit(day);
    });
  const create = () => {
    if (mode === "custom" && !name.trim())
      return notify(t("Escribí un nombre.", "Enter a name."));
    if (
      change((draft) => {
        const routine =
          mode === "auto"
            ? buildAutomaticRoutine(
                { groups, days, goal },
                { makeId, language: draft.settings.language ?? "es" },
              )
            : { id: makeId(), name: name.trim(), goal, days: [] };
        draft.routines.push(routine);
        draft.selected = routine.id;
        setOpen(routine.id);
      })
    ) {
      setCreating(false);
      setName("");
      notify(t("Rutina guardada", "Routine saved"));
    }
  };
  const confirmDelete = (message: string, onConfirm: () => void) =>
    Alert.alert(
      message,
      t("Esta acción no se puede deshacer.", "This can't be undone."),
      [
        { text: t("Cancelar", "Cancel"), style: "cancel" },
        {
          text: t("Eliminar", "Delete"),
          style: "destructive",
          onPress: onConfirm,
        },
      ],
    );

  const supersetDay = superset
    ? snapshot.routines
        .find((item) => item.id === superset.rid)
        ?.days.find((item) => item.id === superset.did)
    : undefined;
  return (
    <Screen>
      <View style={{ alignItems: "flex-start" }}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "700" }}>
            {`‹ ${t("Volver", "Back")}`}
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Title>{t("Mis rutinas", "My routines")}</Title>
        {!creating ? (
          <View style={{ minWidth: 112 }}>
            <Button variant="secondary" onPress={() => setCreating(true)}>
              {t("+ Nueva", "+ New")}
            </Button>
          </View>
        ) : null}
      </View>
      <Notice />
      {creating ? (
        <Card>
          <ChipGroup
            options={[
              { value: "custom", label: t("Armarla yo", "Build it myself") },
              { value: "auto", label: t("Automática", "Automatic") },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === "custom" ? (
            <Field
              label={t("Nombre", "Name")}
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
          ) : null}
          <Label muted>{t("Objetivo", "Goal")}</Label>
          <ChipGroup
            options={goals.map(([value, en]) => ({
              value,
              label: t(value, en),
            }))}
            value={goal}
            onChange={setGoal}
          />
          {mode === "auto" ? (
            <>
              <Label muted>{t("Días por semana", "Days per week")}</Label>
              <ChipGroup
                options={[1, 2, 3, 4, 5, 6, 7].map((value) => ({
                  value,
                  label: String(value),
                }))}
                value={days}
                onChange={setDays}
              />
              <Label muted>
                {t("Músculos a entrenar", "Muscles to train")}
              </Label>
              <ChipGroup
                multiple
                options={muscleGroups.map((group) => ({
                  value: group,
                  label: translate(language, group, group),
                }))}
                value={groups}
                onChange={(group) =>
                  setGroups((current) =>
                    current.includes(group)
                      ? current.filter((item) => item !== group)
                      : [...current, group],
                  )
                }
              />
            </>
          ) : null}
          <Button disabled={mode === "auto" && !groups.length} onPress={create}>
            {t("Crear rutina", "Create routine")}
          </Button>
          <Button variant="ghost" onPress={() => setCreating(false)}>
            {t("Cancelar", "Cancel")}
          </Button>
        </Card>
      ) : null}
      {snapshot.routines.map((routine) => {
        const active = snapshot.selected === routine.id;
        const expanded = open === routine.id;
        return (
          <Card key={routine.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : routine.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space(2),
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {routine.name}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Label muted>
                    {routine.days.length} {t("días", "days")}
                  </Label>
                  {active ? (
                    <Text
                      style={{
                        color: colors.success,
                        fontSize: 12,
                        fontWeight: "800",
                        borderColor: colors.success,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      {t("Activa", "Active")}
                    </Text>
                  ) : null}
                </View>
              </View>
              <SymbolView
                name={
                  expanded
                    ? { ios: "chevron.up", android: "expand_less" }
                    : { ios: "chevron.down", android: "expand_more" }
                }
                tintColor={colors.muted}
                size={18}
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
                  <IconButton
                    label={t("Renombrar", "Rename")}
                    symbol="✎"
                    onPress={() =>
                      setPrompt({
                        type: "rename",
                        rid: routine.id,
                        name: routine.name,
                      })
                    }
                  />
                  <IconButton
                    label={t("Compartir", "Share")}
                    symbol="share"
                    onPress={() => {
                      try {
                        void Share.share({
                          message: `${env.apiUrl}/#routine=${encodeRoutine(snapshot, routine)}`,
                        });
                      } catch (error) {
                        notify(
                          error instanceof Error
                            ? error.message
                            : String(error),
                        );
                      }
                    }}
                  />
                  <Switch
                    accessibilityLabel={t("Usar esta rutina", "Use this routine")}
                    value={active}
                    trackColor={{ true: "#22c55e", false: colors.border }}
                    onValueChange={(value) => {
                      change(
                        (draft) =>
                          void (draft.selected = value ? routine.id : null),
                      );
                    }}
                  />
                  <View style={{ flex: 1 }} />
                  <IconButton
                    label={t("Eliminar", "Delete")}
                    symbol="✕"
                    danger
                    onPress={() =>
                      confirmDelete(
                        t("¿Eliminar la rutina?", "Delete the routine?"),
                        () =>
                          change((draft) => {
                            draft.routines = draft.routines.filter(
                              (item) => item.id !== routine.id,
                            );
                            if (draft.workout?.rid === routine.id)
                              draft.workout = null;
                            if (draft.selected === routine.id)
                              draft.selected = draft.routines[0]?.id ?? null;
                          }),
                      )
                    }
                  />
                </View>
                {routine.days.map((day, dayIndex) => (
                  <View
                    key={day.id}
                    style={{
                      gap: space(2),
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 18,
                      backgroundColor: "#0e1117",
                      padding: space(3),
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space(1.5),
                      }}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: 17,
                          fontWeight: "800",
                          flex: 1,
                        }}
                      >
                        {day.name}
                      </Text>
                      <IconButton
                        label={t("Subir día", "Move day up")}
                        symbol="↑"
                        disabled={dayIndex === 0}
                        onPress={() =>
                          change((draft) => {
                            const list = draft.routines.find(
                              (item) => item.id === routine.id,
                            )?.days;
                            if (list)
                              [list[dayIndex - 1], list[dayIndex]] = [
                                list[dayIndex]!,
                                list[dayIndex - 1]!,
                              ];
                          })
                        }
                      />
                      <IconButton
                        label={t("Renombrar día", "Rename day")}
                        symbol="✎"
                        onPress={() =>
                          setPrompt({
                            type: "rename-day",
                            rid: routine.id,
                            did: day.id,
                            name: day.name,
                          })
                        }
                      />
                      <IconButton
                        label={t("Eliminar día", "Delete day")}
                        symbol="✕"
                        danger
                        onPress={() =>
                          confirmDelete(
                            t("¿Eliminar el día?", "Delete the day?"),
                            () =>
                              change((draft) => {
                                const target = draft.routines.find(
                                  (item) => item.id === routine.id,
                                );
                                if (target)
                                  target.days = target.days.filter(
                                    (item) => item.id !== day.id,
                                  );
                                if (
                                  draft.workout?.rid === routine.id &&
                                  draft.workout.did === day.id
                                )
                                  draft.workout = null;
                              }),
                          )
                        }
                      />
                    </View>
                    {day.items.map((id, index) => {
                      const exercise = findExercise(snapshot, id);
                      return (
                        <View
                          key={`${id}-${index}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: space(1.5),
                            padding: space(2),
                            borderRadius: 14,
                            backgroundColor:
                              index % 2 === 0 ? colors.secondary : "#13171f",
                          }}
                        >
                          <Label style={{ flex: 1 }}>
                            {exercise
                              ? translate(
                                  language,
                                  exercise.name,
                                  exercise.name,
                                )
                              : id}
                          </Label>
                          <IconButton
                            label={t("Subir", "Move up")}
                            symbol="↑"
                            disabled={index === 0}
                            onPress={() =>
                              editDay(routine.id, day.id, (target) => {
                                [target.items[index - 1], target.items[index]] =
                                  [
                                    target.items[index]!,
                                    target.items[index - 1]!,
                                  ];
                              })
                            }
                          />
                          <IconButton
                            label={t("Bajar", "Move down")}
                            symbol="↓"
                            disabled={index === day.items.length - 1}
                            onPress={() =>
                              editDay(routine.id, day.id, (target) => {
                                [target.items[index + 1], target.items[index]] =
                                  [
                                    target.items[index]!,
                                    target.items[index + 1]!,
                                  ];
                              })
                            }
                          />
                          <IconButton
                            label={t("Quitar ejercicio", "Remove exercise")}
                            symbol="✕"
                            danger
                            onPress={() =>
                              editDay(routine.id, day.id, (target) => {
                                target.items.splice(index, 1);
                                target.supersets = target.supersets
                                  ?.map((group) =>
                                    group.filter((item) =>
                                      target.items.includes(item),
                                    ),
                                  )
                                  .filter((group) => group.length > 1);
                              })
                            }
                          />
                        </View>
                      );
                    })}
                    <Button
                      variant="success"
                      onPress={() =>
                        setPicker({ rid: routine.id, did: day.id })
                      }
                    >
                      {t("+ Agregar ejercicios", "+ Add exercises")}
                    </Button>
                    {day.items.length > 1 ? (
                      <Button
                        variant="ghost"
                        onPress={() => {
                          setMembers([]);
                          setSuperset({ rid: routine.id, did: day.id });
                        }}
                      >
                        {day.supersets?.length
                          ? `${t("Superseries", "Supersets")} (${day.supersets.length})`
                          : t("Crear superserie", "Create superset")}
                      </Button>
                    ) : null}
                  </View>
                ))}
                <Button
                  variant="secondary"
                  onPress={() => setPrompt({ type: "day", rid: routine.id })}
                >
                  {t("+ Agregar día", "+ Add day")}
                </Button>
              </>
            ) : null}
          </Card>
        );
      })}
      <TextPrompt
        visible={prompt !== null}
        title={
          prompt?.type === "day"
            ? t("Nuevo día", "New day")
            : prompt?.type === "rename-day"
              ? t("Renombrar día", "Rename day")
              : t("Renombrar rutina", "Rename routine")
        }
        label={t("Nombre", "Name")}
        initial={prompt && "name" in prompt ? prompt.name : ""}
        confirm={t("Guardar", "Save")}
        cancel={t("Cancelar", "Cancel")}
        onClose={() => setPrompt(null)}
        onSubmit={(value) => {
          const current = prompt;
          if (!current) return;
          if (
            change((draft) => {
              const routine = draft.routines.find(
                (item) => item.id === current.rid,
              );
              if (!routine) return;
              if (current.type === "rename") routine.name = value;
              else if (current.type === "day")
                routine.days.push({ id: makeId(), name: value, items: [] });
              else {
                const day = routine.days.find(
                  (item) => item.id === current.did,
                );
                if (day) day.name = value;
              }
            })
          )
            setPrompt(null);
        }}
      />
      <Modal
        visible={superset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSuperset(null)}
      >
        <Pressable
          onPress={() => setSuperset(null)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card style={{ margin: space(4) }}>
              <Title>{t("Superseries", "Supersets")}</Title>
              <Label muted>
                {t(
                  "Elegí los ejercicios que se hacen seguidos, sin descanso entre ellos.",
                  "Choose exercises done back to back, without rest between them.",
                )}
              </Label>
              {supersetDay?.items.map((id, index) => {
                const exercise = findExercise(snapshot, id);
                const grouped = supersetDay.supersets?.some((group) =>
                  group.includes(id),
                );
                return (
                  <Chip
                    key={`${id}-${index}`}
                    role="checkbox"
                    active={members.includes(id)}
                    label={`${grouped ? "🔗 " : ""}${exercise ? translate(language, exercise.name, exercise.name) : id}`}
                    onPress={() =>
                      setMembers((current) =>
                        current.includes(id)
                          ? current.filter((item) => item !== id)
                          : [...current, id],
                      )
                    }
                  />
                );
              })}
              <Button
                disabled={members.length < 2}
                onPress={() => {
                  if (
                    superset &&
                    editDay(superset.rid, superset.did, (day) => {
                      day.supersets = [
                        ...(day.supersets ?? []).filter(
                          (group) => !group.some((id) => members.includes(id)),
                        ),
                        members,
                      ];
                    })
                  )
                    setSuperset(null);
                }}
              >
                {t("Guardar superserie", "Save superset")}
              </Button>
              {supersetDay?.supersets?.length ? (
                <Button
                  variant="ghost"
                  onPress={() => {
                    if (superset)
                      editDay(
                        superset.rid,
                        superset.did,
                        (day) => void (day.supersets = []),
                      );
                    setSuperset(null);
                  }}
                >
                  {t(
                    "Quitar superseries de este día",
                    "Remove supersets from this day",
                  )}
                </Button>
              ) : null}
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <ExercisePicker
        visible={picker !== null}
        onClose={() => setPicker(null)}
        onPick={(ids) =>
          picker &&
          editDay(picker.rid, picker.did, (day) => void day.items.push(...ids))
        }
      />
    </Screen>
  );
}
