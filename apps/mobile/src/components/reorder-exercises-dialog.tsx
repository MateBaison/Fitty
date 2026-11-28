import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { BackButton } from "@/components/back-button";
import { ReorderList } from "@/components/reorder-list";
import { Button, Card, Label, ScrollLockContext } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

export type ReorderRow = {
  key: string;
  /** One name, or every member of a superset. */
  names: string[];
  superset: boolean;
  /** The row that was long-pressed to open the window. */
  highlighted: boolean;
};

/** Compact list of the workout in progress, to drag exercises into another order. */
export function ReorderExercisesDialog({
  rows,
  onMove,
  onClose,
}: {
  rows: ReorderRow[];
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}) {
  const { t } = useAccount();
  const [locked, setLocked] = useState(false);
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
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
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "90%" }}>
          <Card>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space(3),
              }}
            >
              <BackButton onPress={onClose} />
              <View style={{ flex: 1, alignItems: "center", paddingEnd: 56 }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    textAlign: "center",
                    color: colors.foreground,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {t("Ordenar ejercicios", "Reorder exercises")}
                </Text>
              </View>
            </View>
            <Label muted style={{ textAlign: "center" }}>
              {t(
                "Mantené apretado y arrastrá para cambiar el orden. Solo cambia este entrenamiento.",
                "Press and hold, then drag to change the order. Only this workout changes.",
              )}
            </Label>
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEnabled={!locked}
              style={{ flexShrink: 1 }}
              // Room so the lifted row is not clipped at the sides.
              contentContainerStyle={{ padding: space(1) }}
            >
              <ScrollLockContext.Provider value={setLocked}>
                <ReorderList
                  items={rows}
                  keyOf={(row) => row.key}
                  onMove={onMove}
                  renderItem={(row, index, startDrag) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("Mover ejercicio", "Move exercise")}: ${row.names.join(", ")}`}
                      accessibilityActions={[
                        { name: "up", label: t("Subir", "Move up") },
                        { name: "down", label: t("Bajar", "Move down") },
                      ]}
                      onAccessibilityAction={({ nativeEvent }) => {
                        const to =
                          nativeEvent.actionName === "up"
                            ? index - 1
                            : index + 1;
                        if (to >= 0 && to < rows.length) onMove(index, to);
                      }}
                      delayLongPress={150}
                      onLongPress={startDrag}
                      style={{
                        minHeight: 54,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space(3),
                        paddingHorizontal: space(3),
                        paddingVertical: space(2),
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: row.highlighted
                          ? colors.primary
                          : colors.border,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <SymbolView
                        name={{
                          ios: "line.3.horizontal",
                          android: "drag_handle",
                        }}
                        tintColor={colors.muted}
                        size={18}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        {row.superset ? (
                          <Label muted>{t("Superserie", "Superset")}</Label>
                        ) : null}
                        {row.names.map((name, position) => (
                          <Text
                            key={position}
                            style={{
                              color: colors.foreground,
                              fontSize: 15,
                              fontWeight: "800",
                            }}
                          >
                            {name}
                          </Text>
                        ))}
                      </View>
                    </Pressable>
                  )}
                />
              </ScrollLockContext.Provider>
            </ScrollView>
            <Button onPress={onClose}>{t("Listo", "Done")}</Button>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
