import * as Haptics from "expo-haptics";
import { useContext, useRef, useState, type ReactNode } from "react";
import { PanResponder, View } from "react-native";
import { ScrollLockContext } from "@/components/ui";

/**
 * Vertical list reordered by long-pressing a handle and dragging, like the web.
 * `renderItem` receives `startDrag`, to be wired to the handle's onLongPress.
 */
export function ReorderList<T>({
  items,
  keyOf,
  onMove,
  renderItem,
  gap = 8,
}: {
  items: readonly T[];
  keyOf: (item: T, index: number) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, index: number, startDrag: () => void) => ReactNode;
  gap?: number;
}) {
  const setScrollLocked = useContext(ScrollLockContext);
  const heights = useRef<number[]>([]);
  const dragging = useRef<number | null>(null);
  const latest = useRef({ count: items.length, onMove, gap });
  latest.current = { count: items.length, onMove, gap };
  const [drag, setDrag] = useState<{ index: number; dy: number } | null>(null);

  const targetFor = (from: number, dy: number) => {
    const { count, gap: space } = latest.current;
    let target = from;
    let remaining = dy;
    while (remaining > 0 && target < count - 1) {
      const step = (heights.current[target + 1] ?? 0) + space;
      if (remaining < step / 2) break;
      remaining -= step;
      target += 1;
    }
    while (remaining < 0 && target > 0) {
      const step = (heights.current[target - 1] ?? 0) + space;
      if (-remaining < step / 2) break;
      remaining += step;
      target -= 1;
    }
    return target;
  };
  const finish = (dy: number) => {
    const from = dragging.current;
    dragging.current = null;
    setScrollLocked(false);
    setDrag(null);
    if (from === null) return;
    const to = targetFor(from, dy);
    if (to !== from) latest.current.onMove(from, to);
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => dragging.current !== null,
      onMoveShouldSetPanResponderCapture: () => dragging.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) =>
        setDrag((current) => current && { ...current, dy: gesture.dy }),
      onPanResponderRelease: (_, gesture) => finish(gesture.dy),
      onPanResponderTerminate: (_, gesture) => finish(gesture.dy),
    }),
  ).current;

  const target = drag ? targetFor(drag.index, drag.dy) : null;
  const dragHeight = drag ? (heights.current[drag.index] ?? 0) + gap : 0;
  return (
    <View style={{ gap }} {...pan.panHandlers}>
      {items.map((item, index) => {
        let shift = 0;
        if (drag && target !== null && index !== drag.index) {
          if (drag.index < index && index <= target) shift = -dragHeight;
          else if (target <= index && index < drag.index) shift = dragHeight;
        }
        const active = drag?.index === index;
        return (
          <View
            key={keyOf(item, index)}
            onLayout={(event) => {
              heights.current[index] = event.nativeEvent.layout.height;
            }}
            style={{
              zIndex: active ? 10 : 0,
              opacity: active ? 0.92 : 1,
              transform: [
                { translateY: active ? drag.dy : shift },
                { scale: active ? 1.02 : 1 },
              ],
            }}
          >
            {renderItem(item, index, () => {
              dragging.current = index;
              setScrollLocked(true);
              setDrag({ index, dy: 0 });
              void Haptics.selectionAsync();
            })}
          </View>
        );
      })}
    </View>
  );
}
