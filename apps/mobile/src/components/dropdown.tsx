import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Label, styles } from "@/components/ui";
import { colors, space } from "@/theme";

/** A menu that shows only the chosen option until it is tapped, then lists the rest. */
export function Dropdown<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);
  return (
    <View style={{ gap: space(1.5) }}>
      {label ? <Label muted>{label}</Label> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
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
        <Text style={{ color: colors.accent }}>{open ? "▴" : "▾"}</Text>
      </Pressable>
      {open ? (
        <View
          style={{
            borderRadius: 14,
            borderColor: colors.border,
            borderWidth: 1,
            backgroundColor: colors.secondary,
            overflow: "hidden",
          }}
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
                minHeight: 48,
                paddingHorizontal: space(4),
                justifyContent: "center",
                backgroundColor:
                  option.value === value ? "#173a52" : "transparent",
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
        </View>
      ) : null}
    </View>
  );
}
