import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { EXERCISE_NOTE_MAX } from "@fitty/core/domain/exercise-notes";
import { BackButton } from "@/components/back-button";
import { Button, Card, Field, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Floating window to read or edit the standing note of an exercise. */
export function ExerciseNoteDialog({
  name,
  initial,
  onSave,
  onClose,
}: {
  name: string;
  initial: string;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const { t } = useAccount();
  const [note, setNote] = useState(initial);
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
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
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
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
                    {t("Notas de ejercicio", "Exercise notes")}
                  </Text>
                </View>
              </View>
              <Label style={{ textAlign: "center", fontWeight: "800" }}>
                {name}
              </Label>
              <Field
                label={t(
                  "Instrucciones o comentarios sobre este ejercicio",
                  "Instructions or comments about this exercise",
                )}
                value={note}
                onChangeText={setNote}
                autoFocus={!initial}
                maxLength={EXERCISE_NOTE_MAX}
                multiline
              />
              <Label muted style={{ textAlign: "center" }}>
                {t(
                  "Aparece cada vez que hacés este ejercicio.",
                  "It shows every time you do this exercise.",
                )}
              </Label>
              <Button
                onPress={() => {
                  onSave(note);
                  onClose();
                }}
              >
                {t("Guardar", "Save")}
              </Button>
            </Card>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
