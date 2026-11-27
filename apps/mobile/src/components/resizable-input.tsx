import { useRef, useState } from "react";
import { PanResponder, Text, TextInput, View } from "react-native";
import { Label, styles } from "@/components/ui";
import { useInputAlign, useRTL } from "@/lib/direction";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Multi-line box that can be made taller or shorter by dragging its bottom corner. */
export function ResizableInput({
  label,
  value,
  onChangeText,
  onResizing,
  initialHeight = 168,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onResizing: (resizing: boolean) => void;
  initialHeight?: number;
}) {
  const { t } = useAccount();
  const rtl = useRTL();
  const inputAlign = useInputAlign();
  const [height, setHeight] = useState(initialHeight);
  const start = useRef(initialHeight);
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
        const next = Math.min(520, Math.max(72, start.current + gesture.dy));
        heightRef.current = next;
        setHeight(next);
      },
      onPanResponderRelease: () => latest.current(false),
      onPanResponderTerminate: () => latest.current(false),
    }),
  ).current;
  const heightRef = useRef(initialHeight);
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
          style={[styles.input, inputAlign, { height, paddingTop: space(3) }]}
        />
        <View
          {...pan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={t("Redimensionar", "Resize")}
          style={{
            position: "absolute",
            end: 2,
            bottom: 2,
            width: 36,
            height: 36,
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 6,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 18, lineHeight: 18 }}>
            {rtl ? "◣" : "◢"}
          </Text>
        </View>
      </View>
    </View>
  );
}
