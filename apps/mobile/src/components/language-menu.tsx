import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { languageOptions } from "@/components/onboarding";
import { colors, radius, space } from "@/theme";

export const flags: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  zh: "🇨🇳",
  hi: "🇮🇳",
  ar: "🇸🇦",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇧🇷",
};

/** Small flag button that opens a list of flags to change the language. */
export function LanguageMenu({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const top = insets.top + space(2);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={{
          position: "absolute",
          top,
          right: space(4),
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.secondary,
          zIndex: 10,
        }}
      >
        <Text style={{ fontSize: 22 }}>{flags[value] ?? "🌐"}</Text>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityLabel={label}
          style={{ flex: 1 }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              position: "absolute",
              top: top + 46,
              right: space(4),
              backgroundColor: colors.card,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: space(1),
              minWidth: 180,
            }}
          >
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === value }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space(3),
                  paddingHorizontal: space(3),
                  paddingVertical: space(2),
                }}
              >
                <Text style={{ fontSize: 22 }}>{flags[option.value]}</Text>
                <Text
                  style={{
                    color:
                      option.value === value
                        ? colors.accent
                        : colors.foreground,
                    fontWeight: option.value === value ? "700" : "400",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
