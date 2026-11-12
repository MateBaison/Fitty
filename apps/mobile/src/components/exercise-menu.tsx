import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChipGroup } from "@/components/chip";
import { Button, Card, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Floating window with the settings of one exercise of the workout in progress. */
export function ExerciseMenu({
  visible,
  onClose,
  name,
  metric,
  unit,
  inSuperset,
  onMetric,
  onUnit,
  onReplace,
  onDetails,
  onSuperset,
  onLeaveSuperset,
  onRemove,
}: {
  visible: boolean;
  onClose: () => void;
  name: string;
  metric: "reps" | "seconds";
  unit: "kg" | "lb";
  inSuperset: boolean;
  onMetric: (metric: "reps" | "seconds") => void;
  onUnit: (unit: "kg" | "lb") => void;
  onReplace: () => void;
  onDetails: () => void;
  onSuperset: () => void;
  onLeaveSuperset: () => void;
  onRemove: () => void;
}) {
  const { t } = useAccount();
  // Actions that open another window close this one first; iOS needs a moment
  // before it can present the next modal.
  const run = (action: () => void) => () => {
    onClose();
    setTimeout(action, 350);
  };
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
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
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "90%" }}>
          <Card>
            <ScrollView contentContainerStyle={{ gap: space(3) }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                {t("Ajustes del ejercicio", "Exercise settings")}
              </Text>
              <Label muted>{name}</Label>
              <Button variant="secondary" onPress={run(onReplace)}>
                {t("Reemplazar ejercicio", "Replace exercise")}
              </Button>
              <Button variant="secondary" onPress={run(onDetails)}>
                {t("Ver detalles del ejercicio", "View exercise details")}
              </Button>
              <Label muted>{t("Medir por", "Track by")}</Label>
              <ChipGroup
                options={[
                  { value: "reps", label: t("Repeticiones", "Repetitions") },
                  { value: "seconds", label: t("Tiempo", "Time") },
                ]}
                value={metric}
                onChange={onMetric}
              />
              <Label muted>
                {t("Unidad de peso", "Weight unit")} ·{" "}
                {t("Se aplica a toda la cuenta", "Applies to the whole account")}
              </Label>
              <ChipGroup
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lb", label: "lb" },
                ]}
                value={unit}
                onChange={onUnit}
              />
              <Button variant="secondary" onPress={run(onSuperset)}>
                {t("Crear superserie", "Create superset")}
              </Button>
              {inSuperset ? (
                <Button variant="secondary" onPress={run(onLeaveSuperset)}>
                  {t("Quitar de la superserie", "Remove from superset")}
                </Button>
              ) : null}
              <Button variant="destructive" onPress={run(onRemove)}>
                {t("Quitar del entrenamiento", "Remove from workout")}
              </Button>
              <Button variant="ghost" onPress={onClose}>
                {t("Cerrar", "Close")}
              </Button>
            </ScrollView>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
