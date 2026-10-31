import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { exerciseImage } from "@fitty/core/data/exercises";
import { translate } from "@fitty/core/data/translations";
import { type CatalogExercise } from "@fitty/core/domain/workouts";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { ExerciseBrowser } from "@/components/exercise-browser";
import { Notice } from "@/components/notice";
import { Button, Card, Glow, Label, styles } from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

export default function Library() {
  const snapshot = useSnapshot();
  const { t, change, notify } = useAccount();
  const insets = useSafeAreaInsets();
  const language = snapshot.settings.language ?? "es";
  const [selected, setSelected] = useState<CatalogExercise | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const favorite = selected ? snapshot.favorites.includes(selected.id) : false;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Glow />
      <Notice />
      <ExerciseBrowser
        onPress={setSelected}
        onCreate={() => setCreating(true)}
      />
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
              <ScrollView
 showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space(3) }}>
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
