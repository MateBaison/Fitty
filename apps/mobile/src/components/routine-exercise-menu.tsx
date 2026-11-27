import { Modal, Pressable, Text, View } from "react-native";
import { BackButton } from "@/components/back-button";
import { Button, Card, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Floating menu of one exercise of a routine day. */
export function RoutineExerciseMenu({
  visible,
  name,
  canSuperset,
  onClose,
  onReplace,
  onSuperset,
  onRemove,
}: {
  visible: boolean;
  name: string;
  /** A superset needs a second exercise in the day. */
  canSuperset: boolean;
  onClose: () => void;
  onReplace: () => void;
  onSuperset: () => void;
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
        <View>
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
                  {t("Más opciones", "More options")}
                </Text>
                <Label muted style={{ textAlign: "center" }}>
                  {name}
                </Label>
              </View>
            </View>
            <Button variant="secondary" onPress={run(onReplace)}>
              {t("Cambiar ejercicio", "Change exercise")}
            </Button>
            <Button
              variant="secondary"
              disabled={!canSuperset}
              onPress={run(onSuperset)}
            >
              {t("Agregar a superserie", "Add to superset")}
            </Button>
            <Button
              variant="destructive"
              onPress={() => {
                onClose();
                onRemove();
              }}
            >
              {t("Eliminar ejercicio", "Delete exercise")}
            </Button>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
