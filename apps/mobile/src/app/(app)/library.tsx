import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  equipmentFilters,
  exerciseImage,
  fullBodyImage,
  matchesEquipment,
  muscleImages,
  normalizeSearch,
  type EquipmentFilter,
} from "@fitty/core/data/exercises";
import { translate } from "@fitty/core/data/translations";
import {
  muscleGroups,
  type MuscleGroup,
} from "@fitty/core/domain/schemas/exercise";
import { catalogFor, type CatalogExercise } from "@fitty/core/domain/workouts";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { Notice } from "@/components/notice";
import { Button, Card, Glow, Label, styles } from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

type Group = MuscleGroup | "Todos" | "Favoritos";

function ChipButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 44,
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
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Library() {
  const snapshot = useSnapshot();
  const { t, change, notify } = useAccount();
  const insets = useSafeAreaInsets();
  const language = snapshot.settings.language ?? "es";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("Todos");
  const [equipment, setEquipment] = useState<EquipmentFilter>("Todos");
  const [filtering, setFiltering] = useState(false);
  const [zoning, setZoning] = useState(false);
  const [selected, setSelected] = useState<CatalogExercise | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const exercises = useMemo(() => {
    const search = normalizeSearch(query);
    return catalogFor(snapshot).filter(
      (exercise) =>
        (group === "Todos" ||
          (group === "Favoritos"
            ? snapshot.favorites.includes(exercise.id)
            : exercise.group === group)) &&
        matchesEquipment(exercise, equipment) &&
        (!search ||
          normalizeSearch(
            translate(language, exercise.name, exercise.name),
          ).includes(search) ||
          normalizeSearch(`${exercise.name} ${exercise.equipment}`).includes(
            search,
          )),
    );
  }, [snapshot, query, group, equipment, language]);
  const favorite = selected ? snapshot.favorites.includes(selected.id) : false;
  const groupName = (value: Group) =>
    value === "Todos"
      ? t("Todo", "All")
      : value === "Favoritos"
        ? `★ ${t("Favoritos", "Favorites")}`
        : translate(language, value, value);
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Glow />
      <FlatList
        data={exercises}
        numColumns={2}
        columnWrapperStyle={{ gap: space(3) }}
        keyExtractor={(exercise) => exercise.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space(3) }}>
            <Notice />
            <Label muted>{t("Buscar ejercicios", "Search exercises")}</Label>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t(
                "Buscar ejercicio o equipo…",
                "Search exercise or equipment…",
              )}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t("Buscar ejercicios", "Search exercises")}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setZoning(true)}
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
              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
                {t("Seleccionar zona", "Select area")}
              </Text>
              <Text style={{ color: colors.accent, fontWeight: "800" }}>
                {groupName(group)} ▾
              </Text>
            </Pressable>
            {group !== "Favoritos" ? (
              <Card style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={`${env.apiUrl}/assets/${group === "Todos" ? fullBodyImage : muscleImages[group]}`}
                  style={{
                    width: 104,
                    height: 128,
                    borderRadius: 14,
                    backgroundColor: "#0d1016",
                  }}
                  contentFit="cover"
                  cachePolicy="disk"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={groupName(group)}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                    }}
                  >
                    {group === "Todos"
                      ? t("Cuerpo completo", "Whole body")
                      : t("Zona principal", "Primary area")}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 22,
                      fontWeight: "800",
                    }}
                  >
                    {groupName(group)}
                  </Text>
                  <Label muted>
                    {group === "Todos"
                      ? t(
                          "Todos los ejercicios de la biblioteca.",
                          "All exercises in the library.",
                        )
                      : t(
                          "El naranja señala el grupo elegido.",
                          "Orange marks the selected muscle group.",
                        )}
                  </Label>
                </View>
              </Card>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: space(2),
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: filtering }}
                onPress={() => setFiltering((current) => !current)}
                style={{
                  minHeight: 48,
                  paddingHorizontal: space(4),
                  borderRadius: 14,
                  justifyContent: "center",
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                  {filtering ? "▾" : "▸"} {t("Filtrar", "Filter")}
                  {equipment !== "Todos" ? ` · ${equipment}` : ""}
                </Text>
              </Pressable>
              <Label muted>
                {exercises.length} {t("ejercicios", "exercises")}
              </Label>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreating(true)}
                style={{
                  minHeight: 48,
                  paddingHorizontal: space(3),
                  borderRadius: 14,
                  justifyContent: "center",
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                  ＋ {t("Crear ejercicio", "Create exercise")}
                </Text>
              </Pressable>
            </View>
            {filtering ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: space(2),
                }}
              >
                {equipmentFilters.map((name) => (
                  <ChipButton
                    key={name}
                    label={translate(language, name, name)}
                    active={equipment === name}
                    onPress={() => {
                      setEquipment(name);
                      setFiltering(false);
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Label muted>
            {t(
              "No encontramos ejercicios con estos filtros.",
              "No exercises match these filters.",
            )}
          </Label>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(item)}
            style={{
              flex: 1,
              marginBottom: space(3),
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <Image
              source={`${env.apiUrl}${exerciseImage(item, snapshot.profile.gender)}`}
              style={{
                width: "100%",
                aspectRatio: 3 / 2,
                backgroundColor: "#0d1016",
              }}
              contentFit="cover"
              cachePolicy="disk"
              accessibilityIgnoresInvertColors
            />
            <View style={{ padding: space(3), gap: 2 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                {translate(language, item.name, item.name)}
              </Text>
              <Label muted>
                {translate(language, item.group, item.group)} ·{" "}
                {translate(language, item.equipment, item.equipment)}
              </Label>
            </View>
          </Pressable>
        )}
      />
      <Modal
        visible={zoning}
        transparent
        animationType="fade"
        onRequestClose={() => setZoning(false)}
      >
        <Pressable
          onPress={() => setZoning(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "88%" }}>
            <Card>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {t("Seleccionar zona", "Select area")}
              </Text>
              <ScrollView contentContainerStyle={{ gap: space(2) }}>
                {(["Favoritos", "Todos", ...muscleGroups] as const).map(
                  (name) => {
                    const active = group === name;
                    return (
                      <Pressable
                        key={name}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setGroup(name);
                          setZoning(false);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: space(3),
                          padding: space(2),
                          borderRadius: 16,
                          backgroundColor: active ? "#173a52" : colors.secondary,
                          borderColor: active ? colors.primary : colors.border,
                          borderWidth: 1,
                        }}
                      >
                        {name === "Favoritos" ? (
                          <View
                            style={{
                              width: 56,
                              height: 70,
                              borderRadius: 10,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#0d1016",
                            }}
                          >
                            <Text style={{ color: colors.warning, fontSize: 28 }}>
                              ★
                            </Text>
                          </View>
                        ) : (
                          <Image
                            source={`${env.apiUrl}/assets/${name === "Todos" ? fullBodyImage : muscleImages[name]}`}
                            style={{
                              width: 56,
                              height: 70,
                              borderRadius: 10,
                              backgroundColor: "#0d1016",
                            }}
                            contentFit="cover"
                            cachePolicy="disk"
                            accessibilityIgnoresInvertColors
                          />
                        )}
                        <Text
                          style={{
                            flex: 1,
                            color: colors.foreground,
                            fontSize: 16,
                            fontWeight: "800",
                          }}
                        >
                          {groupName(name).replace("★ ", "")}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
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
                {selected ? (
                  <Image
                    source={`${env.apiUrl}${exerciseImage(selected, snapshot.profile.gender)}`}
                    style={{
                      width: "100%",
                      aspectRatio: 3 / 2,
                      backgroundColor: "#0d1016",
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                    accessibilityIgnoresInvertColors
                  />
                ) : null}
                <View style={{ padding: space(4), gap: space(3) }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space(2),
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: colors.foreground,
                        fontSize: 20,
                        fontWeight: "800",
                      }}
                    >
                      {selected
                        ? translate(language, selected.name, selected.name)
                        : ""}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        favorite
                          ? t("Quitar de favoritos", "Remove from favorites")
                          : t("Agregar a favoritos", "Add to favorites")
                      }
                      onPress={() =>
                        selected &&
                        change((draft) => {
                          draft.favorites = favorite
                            ? draft.favorites.filter((id) => id !== selected.id)
                            : [...draft.favorites, selected.id];
                        })
                      }
                      style={{
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
                      <Text style={{ color: colors.warning, fontSize: 22 }}>
                        {favorite ? "★" : "☆"}
                      </Text>
                    </Pressable>
                  </View>
                  {selected ? (
                    <Label muted>
                      {translate(language, selected.group, selected.group)} ·{" "}
                      {translate(
                        language,
                        selected.equipment,
                        selected.equipment,
                      )}
                    </Label>
                  ) : null}
                  {selected?.steps.map((step, index) => (
                    <Label key={index}>
                      {index + 1}. {translate(language, step, step)}
                    </Label>
                  ))}
                  <Button
                    variant="success"
                    onPress={() => {
                      setAdding(selected?.id ?? null);
                      setSelected(null);
                    }}
                  >
                    {t("Agregar a un día", "Add to a day")}
                  </Button>
                  <Button variant="secondary" onPress={() => setSelected(null)}>
                    {t("Cerrar", "Close")}
                  </Button>
                </View>
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={adding !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAdding(null)}
      >
        <Pressable
          onPress={() => setAdding(null)}
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
                {t("Elegir día", "Choose day")}
              </Text>
              {snapshot.routines.flatMap((routine) =>
                routine.days.map((day) => (
                  <Button
                    key={day.id}
                    variant="secondary"
                    onPress={() => {
                      if (
                        adding &&
                        change((draft) => {
                          draft.routines
                            .find((item) => item.id === routine.id)
                            ?.days.find((item) => item.id === day.id)
                            ?.items.push(adding);
                        })
                      ) {
                        setAdding(null);
                        notify(t("Ejercicio agregado", "Exercise added"));
                      }
                    }}
                  >
                    {`${routine.name} · ${day.name}`}
                  </Button>
                )),
              )}
              {!snapshot.routines.some((routine) => routine.days.length) ? (
                <Label muted>
                  {t(
                    "Primero creá una rutina con al menos un día en Inicio.",
                    "First create a routine with at least one day on Home.",
                  )}
                </Label>
              ) : null}
              <Button variant="ghost" onPress={() => setAdding(null)}>
                {t("Cancelar", "Cancel")}
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <CustomExerciseForm
        visible={creating}
        onClose={() => setCreating(false)}
      />
    </View>
  );
}
