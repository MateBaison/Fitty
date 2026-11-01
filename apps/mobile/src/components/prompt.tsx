import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { Button, Card, Field, Title } from "@/components/ui";
import { colors, space } from "@/theme";

/** Small modal with one text field (Alert.prompt is iOS-only). */
export function TextPrompt({
  visible,
  title,
  label,
  initial = "",
  maxLength = 80,
  confirm,
  cancel,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  label: string;
  initial?: string;
  maxLength?: number;
  confirm: string;
  cancel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={onClose}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View>
            <Card style={{ borderColor: colors.border }}>
              <Title>{title}</Title>
              <Field
                label={label}
                value={value}
                onChangeText={setValue}
                autoFocus
                maxLength={maxLength}
                multiline={maxLength > 80}
                onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
              />
              <View style={{ flexDirection: "row", gap: space(3) }}>
                <View style={{ flex: 1 }}>
                  <Button variant="secondary" onPress={onClose}>
                    {cancel}
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    disabled={!value.trim()}
                    onPress={() => onSubmit(value.trim())}
                  >
                    {confirm}
                  </Button>
                </View>
              </View>
            </Card>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
