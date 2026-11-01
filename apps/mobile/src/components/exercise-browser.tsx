import { Image } from "expo-image";
import { exerciseName } from "@/lib/exercise-name";
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
import { Card, Label, styles, DialogScroll } from "@/components/ui";
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

/**
 * Searchable exercise grid with the zone picker, equipment filter and photos,
 * shared by the library and the picker used to build routines.
 */
export function ExerciseBrowser({
  onPress,
  selectedIds,
  onCreate,
  leading,
}: {
  leading?: React.ReactNode;
  onPress: (exercise: CatalogExercise) => void;
  selectedIds?: readonly string[];
  onCreate?: () => void;
}) {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("Todos");
  const [equipment, setEquipment] = useState<EquipmentFilter>("Todos");
  const [filtering, setFiltering] = useState(false);
  const [zoning, setZoning] = useState(false);
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
            exerciseName(language, exercise.name),
          ).includes(search) ||
          normalizeSearch(`${exercise.name} ${exercise.equipment}`).includes(
            search,
          )),
    );
  }, [snapshot, query, group, equipment, language]);
  const groupName = (value: Group) =>
    value === "Todos"
      ? t("Todo", "All")
      : value === "Favoritos"
        ? `★ ${t("Favoritos", "Favorites")}`
        : translate(language, value, value);
  return (
    <>
      <FlatList
 showsVerticalScrollIndicator={false}
        data={exercises}
        numColumns={2}
        columnWrapperStyle={{ gap: space(3) }}
        keyExtractor={(exercise) => exercise.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space(3) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
            {leading}
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("Buscar ejercicio", "Search exercise")}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t("Buscar ejercicios", "Search exercises")}
              style={[styles.input, { flex: 1, minHeight: 44, paddingVertical: space(2) }]}
            />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space(3),
                padding: space(3),
                borderRadius: 24,
                borderColor: colors.border,
                borderWidth: 1,
                backgroundColor: colors.card,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Seleccionar zona", "Select area")}
                onPress={() => setZoning(true)}
              >
                {group === "Favoritos" ? (
                  <View
                    style={{
                      width: 96,
                      height: 132,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#0d1016",
                    }}
                  >
                    <Text style={{ color: colors.warning, fontSize: 44 }}>★</Text>
                  </View>
                ) : (
                  <Image
                    source={`${env.apiUrl}/assets/${group === "Todos" ? fullBodyImage : muscleImages[group]}`}
                    style={{
                      width: 96,
                      height: 132,
                      borderRadius: 14,
                      backgroundColor: "#0d1016",
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                    accessibilityIgnoresInvertColors
                  />
                )}
              </Pressable>
              <View style={{ flex: 1, gap: space(2) }}>
                {(
                  [
                    [
                      t("Seleccionar zona", "Select area"),
                      groupName(group).replace("★ ", ""),
                      () => setZoning(true),
                      false,
                    ],
                    [
                      t("Filtrar", "Filter"),
                      equipment === "Todos"
                        ? t("Todo", "All")
                        : translate(language, equipment, equipment),
                      () => setFiltering((current) => !current),
                      filtering,
                    ],
                  ] as const
                ).map(([title, value, onPress, expanded]) => (
                  <View key={title} style={{ gap: 4 }}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        textAlign: "center",
                      }}
                    >
                      {title} ▾
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={title}
                      accessibilityState={{ expanded }}
                      onPress={onPress}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: space(2),
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 14,
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          color: colors.foreground,
                          fontSize: 17,
                          fontWeight: "800",
                          textAlign: "center",
                        }}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: space(2),
              }}
            >
              <Label muted>
                {exercises.length} {t("ejercicios", "exercises")}
              </Label>
              {onCreate ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onCreate}
                  style={{
                    flexShrink: 1,
                    minHeight: 44,
                    paddingHorizontal: space(3),
                    borderRadius: 14,
                    justifyContent: "center",
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ color: colors.foreground, fontWeight: "800" }}
                  >
                    ＋ {t("Crear ejercicio", "Create exercise")}
                  </Text>
                </Pressable>
              ) : null}
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
            onPress={() => onPress(item)}
            style={{
              flex: 1,
              marginBottom: space(3),
              backgroundColor: colors.card,
              borderColor: selectedIds?.includes(item.id)
                ? colors.primary
                : colors.border,
              borderWidth: selectedIds?.includes(item.id) ? 3 : 1,
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
            {selectedIds?.includes(item.id) ? (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>
                  ✓
                </Text>
              </View>
            ) : null}
            <View style={{ padding: space(3), gap: 2 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                {exerciseName(language, item.name)}
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
        <View style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={() => setZoning(false)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View style={{ maxHeight: "88%" }}>
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
              <DialogScroll contentContainerStyle={{ gap: space(2) }}>
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
              </DialogScroll>
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}
