import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { BackButton } from "@/components/back-button";
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
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}
              >
                <BackButton onPress={onClose} />
                <View style={{ flex: 1 }}>
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
                </View>
              </View>
              <Button variant="secondary" onPress={run(onSuperset)}>
                {t("Crear superserie", "Create superset")}
              </Button>
              {inSuperset ? (
                <Button variant="secondary" onPress={run(onLeaveSuperset)}>
                  {t("Quitar de la superserie", "Remove from superset")}
                </Button>
              ) : null}
              <View style={{ flexDirection: "row", gap: space(3) }}>
                <SwitchCard
                  title={t("Medir por", "Track by")}
                  off={t("Repeticiones", "Repetitions")}
                  on={t("Tiempo", "Time")}
                  value={metric === "seconds"}
                  onChange={(next) => onMetric(next ? "seconds" : "reps")}
                />
                <SwitchCard
                  title={t("Unidad de peso", "Weight unit")}
                  off="kg"
                  on="lb"
                  value={unit === "lb"}
                  onChange={(next) => onUnit(next ? "lb" : "kg")}
                />
              </View>
              <Label muted>
                {t("Unidad de peso", "Weight unit")}: {t("Se aplica a toda la cuenta", "Applies to the whole account")}
              </Label>
              <Button variant="secondary" onPress={run(onReplace)}>
                {t("Reemplazar ejercicio", "Replace exercise")}
              </Button>
              <Button variant="secondary" onPress={run(onDetails)}>
                {t("Ver detalles del ejercicio", "View exercise details")}
              </Button>
              <Button variant="destructive" onPress={run(onRemove)}>
                {t("Quitar del entrenamiento", "Remove from workout")}
              </Button>
            </ScrollView>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

function SwitchCard({
  title,
  off,
  on,
  value,
  onChange,
}: {
  title: string;
  off: string;
  on: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: space(2),
        padding: space(3),
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.secondary,
      }}
    >
      <Label muted>{title}</Label>
      <Switch
        accessibilityLabel={`${title}: ${value ? on : off}`}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#22c55e", false: colors.border }}
      />
      <Text
        style={{
          color: colors.foreground,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {value ? on : off}
      </Text>
    </View>
  );
}
