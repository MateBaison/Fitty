import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  equipmentFilters,
  exerciseImage,
  matchesEquipment,
  normalizeSearch,
  type EquipmentFilter,
} from "@fitty/core/data/exercises";
import { translate } from "@fitty/core/data/translations";
import { muscleGroups } from "@fitty/core/domain/schemas/exercise";
import { catalogFor } from "@fitty/core/domain/workouts";
import { Chip } from "@/components/chip";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { Notice } from "@/components/notice";
import { Button, Glow, Label, styles } from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

export default function Library() {
  const snapshot = useSnapshot();
  const { t, change } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<EquipmentFilter>("Todos");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const exercises = useMemo(() => {
    const search = normalizeSearch(query);
    return catalogFor(snapshot).filter(
      (exercise) =>
        (!group || exercise.group === group) &&
        matchesEquipment(exercise, equipment) &&
        (!search ||
          normalizeSearch(
            translate(language, exercise.name, exercise.name),
          ).includes(search) ||
          normalizeSearch(exercise.name).includes(search)),
    );
  }, [snapshot, query, group, equipment, language]);
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Glow />
      <FlatList
        data={exercises}
        keyExtractor={(exercise) => exercise.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space(3) }}>
            <Notice />
            <Button variant="success" onPress={() => setCreating(true)}>
              {t("+ Crear ejercicio", "+ Create exercise")}
            </Button>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("Buscar ejercicio", "Search exercise")}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t("Buscar ejercicio", "Search exercise")}
              style={styles.input}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: space(2) }}>
                <Chip
                  label={t("Todos", "All")}
                  active={!group}
                  onPress={() => setGroup(null)}
                />
                {muscleGroups.map((name) => (
                  <Chip
                    key={name}
                    label={translate(language, name, name)}
                    active={group === name}
                    onPress={() => setGroup(group === name ? null : name)}
                  />
                ))}
              </View>
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: space(2) }}>
                {equipmentFilters.map((name) => (
                  <Chip
                    key={name}
                    label={translate(language, name, name)}
                    active={equipment === name}
                    onPress={() => setEquipment(name)}
                  />
                ))}
              </View>
            </ScrollView>
            <Label muted>
              {exercises.length} {t("ejercicios", "exercises")}
            </Label>
          </View>
        }
        renderItem={({ item }) => {
          const favorite = snapshot.favorites.includes(item.id);
          const expanded = open === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : item.id)}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: space(3),
              }}
            >
              <Image
                source={`${env.apiUrl}${exerciseImage(item, snapshot.profile.gender)}`}
                style={{
                  width: "100%",
                  aspectRatio: 3 / 2,
                  backgroundColor: colors.secondary,
                }}
                contentFit="cover"
                cachePolicy="disk"
                accessibilityIgnoresInvertColors
              />
              <View style={{ padding: space(4), gap: space(2) }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space(2),
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
                    {translate(language, item.name, item.name)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      favorite
                        ? t("Quitar de favoritos", "Remove from favorites")
                        : t("Agregar a favoritos", "Add to favorites")
                    }
                    hitSlop={8}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    onPress={() =>
                      change((draft) => {
                        draft.favorites = favorite
                          ? draft.favorites.filter((id) => id !== item.id)
                          : [...draft.favorites, item.id];
                      })
                    }
                  >
                    <Text style={{ color: colors.warning, fontSize: 22 }}>
                      {favorite ? "★" : "☆"}
                    </Text>
                  </Pressable>
                </View>
                <Label muted>
                  {translate(language, item.group, item.group)} ·{" "}
                  {translate(language, item.equipment, item.equipment)}
                </Label>
                {expanded
                  ? item.steps.map((step, index) => (
                      <Label key={index}>
                        {index + 1}. {translate(language, step, step)}
                      </Label>
                    ))
                  : null}
              </View>
            </Pressable>
          );
        }}
      />
      <CustomExerciseForm
        visible={creating}
        onClose={() => setCreating(false)}
      />
    </SafeAreaView>
  );
}
