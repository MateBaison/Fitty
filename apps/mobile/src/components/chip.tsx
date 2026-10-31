import { Pressable, Text, View } from "react-native";
import { colors, space } from "@/theme";

export function Chip({
  label,
  active,
  onPress,
  role = "button",
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  role?: "button" | "radio" | "checkbox";
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={
        role === "button" ? { selected: active } : { checked: active }
      }
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: space(3.5),
        borderRadius: 14,
        justifyContent: "center",
        backgroundColor: active ? colors.primary : colors.secondary,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.foreground,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Wrapping row of single- or multi-select chips. */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  multiple,
}: {
  options: readonly { value: T; label: string }[];
  value: T | readonly T[];
  onChange: (value: T) => void;
  multiple?: boolean;
}) {
  const selected = (option: T) =>
    Array.isArray(value) ? value.includes(option) : value === option;
  return (
    <View
      accessibilityRole={multiple ? undefined : "radiogroup"}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}
    >
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          role={multiple ? "checkbox" : "radio"}
          label={option.label}
          active={selected(option.value)}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
