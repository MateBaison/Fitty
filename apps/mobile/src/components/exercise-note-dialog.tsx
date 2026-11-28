import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Alert,
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
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const { t } = useAccount();
  const [note, setNote] = useState(initial);
  const remove = () =>
    Alert.alert(t("¿Eliminar la nota?", "Delete the note?"), undefined, [
      { text: t("Cancelar", "Cancel"), style: "cancel" },
      {
        text: t("Eliminar", "Delete"),
        style: "destructive",
        onPress: () => {
          onSave("");
          onClose();
        },
      },
    ]);
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
                <View style={{ flex: 1, alignItems: "center" }}>
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
                {initial ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("Eliminar nota", "Delete note")}
                    onPress={remove}
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
                    <SymbolView
                      name={{ ios: "trash", android: "delete" }}
                      tintColor={colors.destructive}
                      size={20}
                    />
                  </Pressable>
                ) : (
                  <View style={{ width: 44 }} />
                )}
              </View>
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
