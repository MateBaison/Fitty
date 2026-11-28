import * as Haptics from "expo-haptics";
import { Image, type ImageProps } from "expo-image";
import { use, useEffect, useRef, useState, type ComponentRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import {
  dragDistance,
  dropTarget,
  edgeScroll,
  placeList,
  slotShift,
  stackRows,
} from "@fitty/core/domain/drag-reorder";
import { BottomSpace } from "@/components/bottom-space";
import { Glow, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

const GAP = 6;
const ROW = { min: 48, max: 60 };
const LABEL = 20;

export type ReorderBlock = {
  /** Key of the card where the block starts. */
  key: string;
  /** One exercise, or every member of a superset. */
  members: { name: string; image?: ImageProps["source"] }[];
  superset: boolean;
};

type Session = {
  blocks: ReorderBlock[];
  from: number;
  heights: number[];
  row: number;
  /** Screen position of the area, and the room the list may use inside it. */
  areaY: number;
  top: number;
  bottom: number;
  start: number;
  maxScroll: number;
  startY: number;
  startScroll: number;
  /** How far the finger can still travel each way. */
  room: { up: number; down: number };
  /** Distance from each row to the card it comes from or returns to. */
  origins: number[];
  /** Slot chosen on release, while the cards open again. */
  dropped: number | null;
};

type Native = ComponentRef<typeof View>;

/** How far the held row is from its slot for the finger's position. */
function travelled(session: Session, pointer: { y: number; scroll: number }) {
  const { heights, from, startY, startScroll, maxScroll, room } = session;
  const moved = pointer.y - startY + pointer.scroll - startScroll;
  // A list that scrolls is already placed under the finger.
  return maxScroll ? moved : dragDistance(heights, GAP, from, moved, room);
}

const measure = (view: Native) =>
  new Promise<{ y: number; height: number }>((resolve) =>
    view.measureInWindow((_x, y, _width, height) => resolve({ y, height })),
  );
const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Hold an exercise and every card folds into a compact row in place; the same
 * finger drags it and releasing opens the cards in the new order.
 *
 * Wrap the screen in a view with `areaProps`, give each card `cardRef`, call
 * `start` from the long press and render `overlay` on top.
 */
export function useWorkoutReorder(onMove: (from: number, to: number) => void) {
  const barSpace = use(BottomSpace);
  const area = useRef<Native>(null);
  const cards = useRef(new Map<string, Native>());
  // The finger being followed; set at once, before anything is measured.
  const finger = useRef<{ y: number; panning: boolean } | null>(null);
  const session = useRef<Session | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);
  const [view, setView] = useState<Session | null>(null);
  const [pointer, setPointer] = useState({ y: 0, scroll: 0 });
  const position = useRef(pointer);
  const moveTo = (next: { y: number; scroll: number }) => {
    position.current = next;
    setPointer(next);
  };
  const latest = useRef(onMove);
  latest.current = onMove;

  const show = (next: Session | null) => {
    session.current = next;
    setView(next);
  };
  const close = () => {
    show(null);
    setActive(false);
  };

  const start = async (blocks: ReorderBlock[], from: number, pageY: number) => {
    if (finger.current || session.current || blocks.length < 2 || !area.current)
      return;
    const held = { y: pageY, panning: false };
    finger.current = held;
    setActive(true);
    void Haptics.selectionAsync();
    const box = await measure(area.current);
    const rects = await Promise.all(
      blocks.map((block) => {
        const card = cards.current.get(block.key);
        return card ? measure(card) : null;
      }),
    );
    // Released before there was anything to show.
    if (finger.current !== held) return;
    const top = space(4);
    const bottom = box.height - barSpace - space(2);
    const units = blocks.reduce((sum, block) => sum + block.members.length, 0);
    const row = Math.max(
      ROW.min,
      Math.min(ROW.max, Math.floor((bottom - top) / units) - GAP),
    );
    const heights = blocks.map(
      (block) => block.members.length * row + (block.superset ? LABEL : 0),
    );
    const placed = placeList(heights, GAP, from, pageY - box.y, top, bottom);
    const { tops } = stackRows(heights, GAP);
    const origins = rects.map((rect, index) => {
      if (!rect) return 0;
      const slot = placed.start + tops[index]! - placed.scroll;
      return Math.max(-box.height, Math.min(box.height, rect.y - box.y - slot));
    });
    moveTo({ y: held.y, scroll: placed.scroll });
    progress.setValue(0);
    show({
      blocks,
      from,
      heights,
      row,
      areaY: box.y,
      top,
      bottom,
      start: placed.start,
      maxScroll: placed.max,
      startY: pageY,
      startScroll: placed.scroll,
      room: {
        up: pageY - box.y - space(6),
        down: box.y + box.height - pageY - space(6),
      },
      origins,
      dropped: null,
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const finish = async () => {
    if (!finger.current) return;
    finger.current = null;
    const current = session.current;
    if (!current) return setActive(false);
    const { from, heights } = current;
    const { scroll } = position.current;
    const to = dropTarget(
      heights,
      GAP,
      from,
      travelled(current, position.current),
    );
    show({ ...current, dropped: to });
    if (to !== from) latest.current(from, to);
    // Let the cards take their new places, then open towards them.
    await frame();
    await frame();
    const { tops } = stackRows(heights, GAP);
    const origins = await Promise.all(
      current.blocks.map(async (block, index) => {
        const card = cards.current.get(block.key);
        if (!card) return 0;
        const rect = await measure(card);
        const slot =
          current.start +
          tops[index]! -
          scroll +
          slotShift(heights, GAP, from, to, index);
        return rect.y - current.areaY - slot;
      }),
    );
    show({ ...current, dropped: to, origins });
    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(close);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // A list taller than the screen scrolls while the finger rests near an edge.
  const scrolls = Boolean(view && view.maxScroll > 0 && view.dropped === null);
  useEffect(() => {
    if (!scrolls) return;
    const timer = setInterval(() => {
      const current = session.current;
      if (!current || !finger.current) return;
      const { y, scroll } = position.current;
      const next = Math.max(
        0,
        Math.min(
          current.maxScroll,
          scroll + edgeScroll(y - current.areaY, current.top, current.bottom),
        ),
      );
      if (next !== scroll) moveTo({ y, scroll: next });
    }, 16);
    return () => clearInterval(timer);
  }, [scrolls]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => finger.current !== null,
      onMoveShouldSetPanResponderCapture: () => finger.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (finger.current) finger.current.panning = true;
      },
      onPanResponderMove: (_, gesture) => {
        if (!finger.current) return;
        finger.current.y = gesture.moveY;
        moveTo({ y: gesture.moveY, scroll: position.current.scroll });
      },
      onPanResponderRelease: () => void finishRef.current(),
      onPanResponderTerminate: () => void finishRef.current(),
    }),
  ).current;
  // Lifting the finger without moving drops the exercise where it was.
  const lifted = () => {
    if (finger.current && !finger.current.panning) void finishRef.current();
  };

  return {
    /** The screen must not scroll meanwhile. */
    active,
    start,
    cardRef: (key: string) => (card: Native | null) => {
      if (card) cards.current.set(key, card);
      else cards.current.delete(key);
    },
    areaProps: {
      ref: area,
      ...pan.panHandlers,
      onTouchEnd: lifted,
      onTouchCancel: lifted,
    },
    overlay: view ? (
      <Overlay session={view} pointer={pointer} progress={progress} />
    ) : null,
  };
}

function Overlay({
  session,
  pointer,
  progress,
}: {
  session: Session;
  pointer: { y: number; scroll: number };
  progress: Animated.Value;
}) {
  const { from, heights, dropped } = session;
  const dy = travelled(session, pointer);
  const to = dropped ?? dropTarget(heights, GAP, from, dy);
  const { tops } = stackRows(heights, GAP);
  return (
    <Animated.View
      pointerEvents={dropped === null ? "auto" : "none"}
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: "hidden",
          opacity: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1],
          }),
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background },
        ]}
      />
      <Glow />
      {session.blocks.map((block, index) => {
        const held = index === from;
        const follow = held && dropped === null;
        return (
          <Row
            key={block.key}
            block={block}
            top={session.start + tops[index]! - pointer.scroll}
            height={heights[index]!}
            size={session.row}
            shift={follow ? dy : slotShift(heights, GAP, from, to, index)}
            follow={follow}
            held={held}
            // Dimmed while only pressed, solid once it is on the move.
            dimmed={follow && Math.abs(dy) < 6}
            origin={session.origins[index] ?? 0}
            progress={progress}
          />
        );
      })}
    </Animated.View>
  );
}

function Row({
  block,
  top,
  height,
  size,
  shift,
  follow,
  held,
  dimmed,
  origin,
  progress,
}: {
  block: ReorderBlock;
  top: number;
  height: number;
  size: number;
  shift: number;
  /** Stays under the finger instead of gliding. */
  follow: boolean;
  held: boolean;
  dimmed: boolean;
  origin: number;
  progress: Animated.Value;
}) {
  const { t } = useAccount();
  const slide = useRef(new Animated.Value(follow ? shift : 0)).current;
  useEffect(() => {
    if (follow) return slide.setValue(shift);
    const animation = Animated.timing(slide, {
      toValue: shift,
      duration: 150,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [follow, shift, slide]);
  const thumb = size - 14;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: space(4),
        right: space(4),
        top,
        height,
        zIndex: held ? 10 : 0,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [origin, 0],
            }),
          },
        ],
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          borderRadius: 14,
          paddingHorizontal: space(2),
          backgroundColor: held ? colors.background : "transparent",
          opacity: dimmed ? 0.5 : 1,
          transform: [{ translateY: slide }],
        }}
      >
        {block.superset ? (
          <Label muted style={{ fontSize: 12, height: LABEL }}>
            {t("Superserie", "Superset")}
          </Label>
        ) : null}
        {block.members.map((member, position) => (
          <View
            key={position}
            style={{
              height: size,
              flexDirection: "row",
              alignItems: "center",
              gap: space(3),
            }}
          >
            <Image
              source={member.image}
              style={{
                width: thumb,
                height: thumb,
                borderRadius: thumb / 2,
                backgroundColor: "#0d1016",
              }}
              contentFit="cover"
              cachePolicy="disk"
              accessibilityIgnoresInvertColors
            />
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                color: colors.foreground,
                fontSize: 17,
                fontWeight: "800",
              }}
            >
              {member.name}
            </Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}
