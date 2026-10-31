import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseBrowser } from "@/components/exercise-browser";
import { Button, Glow, styles } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/**
 * Full-screen exercise picker built on the same browser as the library: zone and
 * favorites selector, photos, search and filter. Several exercises can be marked
 * before continuing, or one is picked immediately with `single`.
 */
export function ExercisePicker({
  visible,
  onClose,
  onPick,
  single,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (ids: string[]) => void;
  /** Pick one exercise immediately, e.g. to replace a workout exercise. */
  single?: boolean;
  title?: string;
}) {
  const { t } = useAccount();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const close = () => {
    setSelected([]);
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Glow />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: space(4),
            paddingTop: space(3),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Cancelar", "Cancel")}
            onPress={close}
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
            <Text style={{ color: colors.accent, fontSize: 22, fontWeight: "700" }}>
              ‹
            </Text>
          </Pressable>
          <Text
            accessibilityRole="header"
            style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}
          >
            {title ?? t("Agregar ejercicios", "Add exercises")}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <ExerciseBrowser
          selectedIds={selected}
          onPress={(exercise) => {
            if (single) {
              onPick([exercise.id]);
              close();
              return;
            }
            setSelected((current) =>
              current.includes(exercise.id)
                ? current.filter((id) => id !== exercise.id)
                : [...current, exercise.id],
            );
          }}
        />
        {!single ? (
          <View style={{ paddingHorizontal: space(4), paddingVertical: space(3) }}>
            <Button
              disabled={!selected.length}
              onPress={() => {
                onPick(selected);
                close();
              }}
            >
              {selected.length
                ? `${t("Continuar", "Continue")} (${selected.length})`
                : t("Elegí ejercicios", "Choose exercises")}
            </Button>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
