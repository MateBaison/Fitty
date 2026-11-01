import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { localizedSetTypes } from "@fitty/core/data/set-types";
import { Button, Card, DialogScroll, Label } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

export const typeColor: Record<string, string> = {
  warmup: "#facc15",
  normal: "#4ade80",
  failure: "#fb7185",
  drop: "#38bdf8",
  pyramid: "#c084fc",
};

export function typeHelp(id: string, t: (es: string, en: string) => string) {
  switch (id) {
    case "warmup":
      return t(
        "Usá una carga liviana para preparar el movimiento y practicar la técnica antes de las series de trabajo, sin agotarte.",
        "Use a light load to prepare the movement and practice technique before working sets, without tiring yourself out.",
      );
    case "failure":
      return t(
        "Llegás al límite de repeticiones que podés completar con buena técnica. Registrá solo las repeticiones completas y no fuerces una repetición insegura; usá asistencia o protecciones si corresponde.",
        "Reach the limit of repetitions you can complete with good form. Log completed repetitions only; do not force an unsafe repetition. Use a spotter or safety equipment when appropriate.",
      );
    case "drop":
      return t(
        "Empezá con una carga que permita unas 8–12 repeticiones con buena técnica, no con tu peso máximo. Al llegar al fallo técnico, reducí un 20–25% del peso que estás usando y continuá con poco descanso. Podés hacer 1–3 bajadas. Registrá cada tramo por separado.",
        "Start with a load you can lift for about 8–12 controlled repetitions, not your maximum weight. At technical failure, reduce the current load by 20–25% and continue with little rest. Use 1–3 drops. Log each segment separately.",
      );
    case "pyramid":
      return t(
        "Subí el peso en cada tramo y luego bajalo. Por ejemplo: 20 → 25 → 30 → 25 → 20 kg. Registrá el peso y las repeticiones de cada tramo por separado.",
        "Increase the weight in each segment, then decrease it. For example: 20 → 25 → 30 → 25 → 20 kg. Log weight and repetitions for each segment separately.",
      );
    default:
      return t(
        "Realizá las repeticiones previstas con una carga adecuada y buena técnica. Descansá antes de la siguiente serie.",
        "Perform your planned repetitions with an appropriate load and good technique. Rest before the next set.",
      );
  }
}

/** Set type chooser with a back arrow, a centered title and a help toggle, shared by workouts and the editor. */
export function SetTypeDialog({
  visible,
  current,
  onClose,
  onSelect,
  onAddDrop,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSelect: (type: string) => void;
  /** Shown for drop and pyramid sets. */
  onAddDrop?: () => void;
}) {
  const { t } = useAccount();
  const language = useSnapshot().settings.language ?? "es";
  const types = localizedSetTypes(language);
  const [help, setHelp] = useState(false);
  const circle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderColor: colors.border,
    borderWidth: 1,
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "90%" }}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Volver", "Back")}
                onPress={onClose}
                style={{ ...circle, backgroundColor: colors.secondary }}
              >
                <Text style={{ color: colors.accent, fontSize: 22, fontWeight: "800", lineHeight: 26 }}>‹</Text>
              </Pressable>
              <Text
                accessibilityRole="header"
                style={{ flex: 1, textAlign: "center", color: colors.foreground, fontSize: 20, fontWeight: "800" }}
              >
                {t("Tipo de serie", "Set type")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Ayuda sobre tipos de serie", "Help with set types")}
                accessibilityState={{ expanded: help }}
                onPress={() => setHelp((open) => !open)}
                style={{ ...circle, backgroundColor: help ? colors.primary : colors.secondary }}
              >
                <Text style={{ color: help ? colors.primaryForeground : colors.accent, fontSize: 18, fontWeight: "800" }}>
                  ?
                </Text>
              </Pressable>
            </View>
            <DialogScroll contentContainerStyle={{ gap: space(3) }}>
              {types.map((type) => (
                <View key={type.id} style={{ gap: space(2) }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: current === type.id }}
                    onPress={() => onSelect(type.id)}
                    style={{
                      minHeight: 52,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: space(3),
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: current === type.id ? typeColor[type.id] : colors.border,
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <Text style={{ color: typeColor[type.id], fontSize: 18, fontWeight: "800" }}>
                      {type.letter}
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>
                      {type.name}
                    </Text>
                  </Pressable>
                  {help ? <Label muted>{typeHelp(type.id, t)}</Label> : null}
                </View>
              ))}
              {onAddDrop && (current === "drop" || current === "pyramid") ? (
                <Button variant="secondary" onPress={onAddDrop}>
                  {t("+ Agregar descenso", "+ Add drop")}
                </Button>
              ) : null}
            </DialogScroll>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
