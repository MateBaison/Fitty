import { useRef, useState } from "react";
import { PanResponder, Text, TextInput, View } from "react-native";
import { Label, styles } from "@/components/ui";
import { colors, space } from "@/theme";

/** Multi-line box that can be made taller or shorter by dragging its bottom-right corner. */
export function ResizableInput({
  label,
  value,
  onChangeText,
  onResizing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onResizing: (resizing: boolean) => void;
}) {
  const [height, setHeight] = useState(168);
  const start = useRef(168);
  const latest = useRef(onResizing);
  latest.current = onResizing;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = heightRef.current;
        latest.current(true);
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(520, Math.max(110, start.current + gesture.dy));
        heightRef.current = next;
        setHeight(next);
      },
      onPanResponderRelease: () => latest.current(false),
      onPanResponderTerminate: () => latest.current(false),
    }),
  ).current;
  const heightRef = useRef(168);
  return (
    <View style={{ gap: space(1.5) }}>
      <Label muted>{label}</Label>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={5000}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          style={[styles.input, { height, paddingTop: space(3) }]}
        />
        <View
          {...pan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Redimensionar"
          style={{
            position: "absolute",
            right: 2,
            bottom: 2,
            width: 36,
            height: 36,
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 6,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 18, lineHeight: 18 }}>◢</Text>
        </View>
      </View>
    </View>
  );
}
