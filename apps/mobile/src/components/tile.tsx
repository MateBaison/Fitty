import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import { Label } from "@/components/ui";
import { colors, radius, space } from "@/theme";

/** Two tiles side by side; both take the height of the taller one. */
export function TileRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: space(3) }}>{children}</View>
  );
}

/** A square-ish choice showing what it is and its current value. Give it a flex wrapper. */
export function Tile({
  icon,
  label,
  value,
  disabled,
  expanded,
  onPress,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
  disabled?: boolean;
  expanded?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        // Grows to the row's height without collapsing taller content.
        flexGrow: 1,
        minHeight: 108,
        gap: space(1.5),
        padding: space(3.5),
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.secondary,
        opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
      })}
    >
      <SymbolView name={icon} tintColor={colors.primary} size={22} />
      <Label muted numberOfLines={2}>
        {label}
      </Label>
      <Text
        numberOfLines={2}
        style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}
      >
        {value}
      </Text>
    </Pressable>
  );
}
