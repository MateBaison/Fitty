import { useRef, useState, type ComponentRef } from "react";
import { PanResponder, View } from "react-native";
import { colors } from "@/theme";

/** Draggable slider, horizontal or vertical (top is the maximum), with no native module. */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  vertical = false,
  length = 260,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  vertical?: boolean;
  length?: number;
}) {
  const box = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef(0);
  const latest = useRef({ min, max, step, onChange, vertical, length });
  latest.current = { min, max, step, onChange, vertical, length };
  const [, force] = useState(0);
  const apply = (page: number) => {
    const c = latest.current;
    const along = Math.min(Math.max(page - origin.current, 0), c.length);
    const fraction = c.vertical ? 1 - along / c.length : along / c.length;
    const raw = c.min + fraction * (c.max - c.min);
    const snapped = Math.round(raw / c.step) * c.step;
    c.onChange(
      Math.round(Math.min(c.max, Math.max(c.min, snapped)) * 1000) / 1000,
    );
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const page = latest.current.vertical
          ? event.nativeEvent.pageY
          : event.nativeEvent.pageX;
        box.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
          origin.current = latest.current.vertical ? pageY : pageX;
          apply(page);
          force((n) => n + 1);
        });
      },
      onPanResponderMove: (event) =>
        apply(
          latest.current.vertical
            ? event.nativeEvent.pageY
            : event.nativeEvent.pageX,
        ),
    }),
  ).current;
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const position = (vertical ? 1 - fraction : fraction) * length;
  const thickness = 8;
  return (
    <View
      ref={box}
      {...pan.panHandlers}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      style={
        vertical
          ? { width: 56, height: length + 28, alignItems: "center", paddingVertical: 14 }
          : { height: 56, width: length + 28, justifyContent: "center", paddingHorizontal: 14 }
      }
    >
      <View
        pointerEvents="none"
        style={
          vertical
            ? { width: thickness, height: length, borderRadius: 4, backgroundColor: colors.border }
            : { height: thickness, width: length, borderRadius: 4, backgroundColor: colors.border }
        }
      >
        <View
          style={
            vertical
              ? { position: "absolute", bottom: 0, width: thickness, height: length - position, borderRadius: 4, backgroundColor: colors.primary }
              : { position: "absolute", left: 0, height: thickness, width: position, borderRadius: 4, backgroundColor: colors.primary }
          }
        />
        <View
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#ffffff",
            borderColor: colors.primary,
            borderWidth: 3,
            ...(vertical
              ? { top: position - 14, left: thickness / 2 - 14 }
              : { left: position - 14, top: thickness / 2 - 14 }),
          }}
        />
      </View>
    </View>
  );
}
