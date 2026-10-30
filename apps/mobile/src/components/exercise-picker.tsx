import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { normalizeSearch } from "@fitty/core/data/exercises";
import { translate } from "@fitty/core/data/translations";
import { muscleGroups } from "@fitty/core/domain/schemas/exercise";
import { catalogFor } from "@fitty/core/domain/workouts";
import { ChipGroup } from "@/components/chip";
import { Button, Label, styles, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Full-screen multi-select exercise picker; favorites are listed first. */
export function ExercisePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (ids: string[]) => void;
}) {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const items = useMemo(() => {
    const search = normalizeSearch(query);
    return catalogFor(snapshot)
      .filter(
        (exercise) =>
          (group === "all" || exercise.group === group) &&
          (!search ||
            normalizeSearch(
              translate(language, exercise.name, exercise.name),
            ).includes(search)),
      )
      .sort(
        (a, b) =>
          Number(snapshot.favorites.includes(b.id)) -
          Number(snapshot.favorites.includes(a.id)),
      );
  }, [snapshot, query, group, language]);
  const close = () => {
    setSelected([]);
    setQuery("");
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.screen}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={{ gap: space(3) }}>
              <Title>{t("Agregar ejercicios", "Add exercises")}</Title>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("Buscar ejercicio", "Search exercise")}
                placeholderTextColor={colors.muted}
                accessibilityLabel={t("Buscar ejercicio", "Search exercise")}
                style={styles.input}
              />
              <ChipGroup
                options={[
                  { value: "all", label: t("Todos", "All") },
                  ...muscleGroups.map((name) => ({
                    value: name as string,
                    label: translate(language, name, name),
                  })),
                ]}
                value={group}
                onChange={setGroup}
              />
            </View>
          }
          renderItem={({ item }) => {
            const checked = selected.includes(item.id);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() =>
                  setSelected((current) =>
                    checked
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id],
                  )
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space(3),
                  minHeight: 56,
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                }}
              >
                <Text
                  style={{
                    color: checked ? colors.primary : colors.muted,
                    fontSize: 22,
                  }}
                >
                  {checked ? "☑" : "☐"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Label>
                    {snapshot.favorites.includes(item.id) ? "★ " : ""}
                    {translate(language, item.name, item.name)}
                  </Label>
                  <Label muted>
                    {translate(language, item.group, item.group)} ·{" "}
                    {translate(language, item.equipment, item.equipment)}
                  </Label>
                </View>
              </Pressable>
            );
          }}
        />
        <View
          style={{ flexDirection: "row", gap: space(3), padding: space(4) }}
        >
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={close}>
              {t("Cancelar", "Cancel")}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              disabled={!selected.length}
              onPress={() => {
                onPick(selected);
                close();
              }}
            >
              {`${t("Agregar", "Add")} (${selected.length})`}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
