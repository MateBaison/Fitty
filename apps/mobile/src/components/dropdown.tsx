import { useRef, useState, type ComponentRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Label, styles } from "@/components/ui";
import { colors, space } from "@/theme";

const ROW = 48;
const MAX_HEIGHT = 320;

/** Shows the chosen option; tapping opens a floating menu over the screen instead of pushing the content down. */
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
  const [rect, setRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const insets = useSafeAreaInsets();
  const screen = useWindowDimensions();
  const chosen = options.find((option) => option.value === value);
  const open = rect !== null;
  const menuHeight = Math.min(options.length * ROW, MAX_HEIGHT);
  const placeMenu = () => {
    if (!rect) return {};
    const below = rect.y + rect.height + 4;
    const roomBelow = screen.height - insets.bottom - 8 - below;
    const top =
      roomBelow >= menuHeight
        ? below
        : Math.max(insets.top + 8, rect.y - menuHeight - 4);
    return { top, left: rect.x, width: rect.width };
  };
  return (
    <View style={{ gap: space(1.5) }}>
      {label ? <Label muted>{label}</Label> : null}
      <Pressable
        ref={anchor}
        collapsable={false}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() =>
          anchor.current?.measureInWindow(
            (x: number, y: number, width: number, height: number) =>
              setRect({ x, y, width, height }),
          )
        }
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
        statusBarTranslucent
        onRequestClose={() => setRect(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          style={{ flex: 1 }}
          onPress={() => setRect(null)}
        >
          <View
            style={[
              {
                position: "absolute",
                maxHeight: MAX_HEIGHT,
                borderRadius: 14,
                borderColor: colors.border,
                borderWidth: 1,
                backgroundColor: colors.card,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 12,
              },
              placeMenu(),
            ]}
          >
            <ScrollView bounces={false}>
              {options.map((option) => (
                <Pressable
                  key={String(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option.value === value }}
                  onPress={() => {
                    onChange(option.value);
                    setRect(null);
                  }}
                  style={{
                    minHeight: ROW,
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
