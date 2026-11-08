import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Label, styles } from "@/components/ui";
import { colors, space } from "@/theme";

const ROW = 52;

/**
 * Shows the chosen option; tapping opens a floating window in the middle of
 * the screen (same look as the other pickers) instead of expanding in place.
 */
export function Dropdown<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder,
  inline,
}: {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Hide the label above the field (the caller shows it); the window title stays. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);
  return (
    <View style={{ gap: space(1.5) }}>
      {label && !inline ? <Label muted>{label}</Label> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space(2),
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: chosen ? colors.foreground : colors.muted,
            fontSize: 16,
          }}
        >
          {chosen?.label ?? placeholder ?? ""}
        </Text>
        <Text style={{ color: colors.accent }}>▾</Text>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
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
            accessibilityLabel={label}
            onPress={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <View style={{ maxHeight: "80%" }}>
            <Card>
              {label ? (
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {label}
                </Text>
              ) : null}
              <ScrollView
                bounces={false}
                style={{ maxHeight: ROW * 6 }}
                contentContainerStyle={{ gap: space(1) }}
              >
                {options.map((option) => (
                  <Pressable
                    key={String(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: option.value === value }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={{
                      minHeight: ROW,
                      paddingHorizontal: space(4),
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor:
                        option.value === value ? "#173a52" : colors.secondary,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 16,
                        fontWeight: option.value === value ? "800" : "500",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Card>
          </View>
        </View>
      </Modal>
    </View>
  );
}
