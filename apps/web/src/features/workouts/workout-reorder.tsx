"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  dropTarget,
  edgeScroll,
  placeList,
  slotShift,
  stackRows,
} from "@fitty/core/domain/drag-reorder";
import type { CatalogExercise } from "@fitty/core/domain/workouts";
import { ExerciseVisual } from "@/features/exercises/exercise-visual";
import { useApp } from "@/state/app-provider";
import type { HeldPointer } from "./use-long-press";

const GAP = 6;
const ROW = { min: 48, max: 60 };
const LABEL = 20;
const FOLD_MS = 220;

export type ReorderBlock = {
  /** Key of the card where the block starts. */
  key: string;
  /** One exercise, or every member of a superset. */
  members: { name: string; exercise?: CatalogExercise }[];
  superset: boolean;
};

export type ReorderStart = HeldPointer & {
  blocks: ReorderBlock[];
  from: number;
};

type Layout = {
  heights: number[];
  row: number;
  /** Where the overlay starts, and the room the list may use inside it. */
  areaTop: number;
  top: number;
  bottom: number;
  left: number;
  width: number;
  start: number;
  max: number;
  startScroll: number;
  /** Distance from each row to the card it comes from or returns to. */
  origins: number[];
};

const card = (key: string) =>
  document.querySelector(`[data-entry-key="${CSS.escape(key)}"]`);

/**
 * The compact list shown in place while an exercise is held: the cards fold
 * into rows, the same pointer drags one and releasing opens them again.
 */
export function WorkoutReorder({
  start,
  onMove,
  onClose,
}: {
  start: ReorderStart;
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}) {
  const { t } = useApp();
  const { blocks, from } = start;
  const [layout, setLayout] = useState<Layout | null>(null);
  const [open, setOpen] = useState(false);
  const [pointer, setPointer] = useState({ y: start.y, scroll: 0 });
  // Slot chosen on release, while the cards open again.
  const [dropped, setDropped] = useState<number | null>(null);
  const live = useRef({ layout, pointer, dropped, onMove, onClose });
  useLayoutEffect(() => {
    live.current = { layout, pointer, dropped, onMove, onClose };
  });

  useLayoutEffect(() => {
    const header = document.querySelector(".app-header");
    const bar = document.querySelector(".bottom-nav");
    const areaTop = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
    const barTop = bar?.getBoundingClientRect().top;
    const top = 16;
    const bottom = (barTop || window.innerHeight) - areaTop - 8;
    const units = blocks.reduce((sum, block) => sum + block.members.length, 0);
    const row = Math.max(
      ROW.min,
      Math.min(ROW.max, Math.floor((bottom - top) / units) - GAP),
    );
    const heights = blocks.map(
      (block) => block.members.length * row + (block.superset ? LABEL : 0),
    );
    const placed = placeList(
      heights,
      GAP,
      from,
      start.y - areaTop,
      top,
      bottom,
    );
    const { tops } = stackRows(heights, GAP);
    const rects = blocks.map((block) =>
      card(block.key)?.getBoundingClientRect(),
    );
    const height = window.innerHeight;
    setPointer({ y: start.y, scroll: placed.scroll });
    setLayout({
      heights,
      row,
      areaTop,
      top,
      bottom,
      left: rects[from]?.left ?? 16,
      width: rects[from]?.width ?? window.innerWidth - 32,
      start: placed.start,
      max: placed.max,
      startScroll: placed.scroll,
      origins: rects.map((rect, index) => {
        if (!rect) return 0;
        const slot = areaTop + placed.start + tops[index]! - placed.scroll;
        return Math.max(-height, Math.min(height, rect.top - slot));
      }),
    });
    // Paint the rows over their cards first, then let them fold.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setOpen(true));
    });
    return () => cancelAnimationFrame(frame);
    // The geometry is fixed for the whole gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let done = false;
    let timer = 0;
    let frame = 0;
    const finish = (commit: boolean) => {
      if (done) return;
      done = true;
      const { layout, pointer, onMove, onClose } = live.current;
      if (!layout) return onClose();
      const to = commit
        ? dropTarget(
            layout.heights,
            GAP,
            from,
            pointer.y - start.y + pointer.scroll - layout.startScroll,
          )
        : from;
      setDropped(to);
      const scrolled = window.scrollY;
      if (to !== from) onMove(from, to);
      // Let the cards take their new places, then open towards them.
      frame = requestAnimationFrame(() => {
        window.scrollTo({ top: scrolled, behavior: "instant" });
        frame = requestAnimationFrame(() => {
          const { tops } = stackRows(layout.heights, GAP);
          const origins = blocks.map((block, index) => {
            const rect = card(block.key)?.getBoundingClientRect();
            if (!rect) return 0;
            const slot =
              layout.areaTop +
              layout.start +
              tops[index]! -
              live.current.pointer.scroll +
              slotShift(layout.heights, GAP, from, to, index);
            return rect.top - slot;
          });
          setLayout({ ...layout, origins });
          setOpen(false);
          timer = window.setTimeout(onClose, FOLD_MS);
        });
      });
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== start.pointerId || done) return;
      // The button was released outside the window.
      if (event.pointerType === "mouse" && !(event.buttons & 1))
        return finish(true);
      const y = event.clientY;
      setPointer((current) => ({ ...current, y }));
      live.current.pointer = { ...live.current.pointer, y };
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId === start.pointerId) finish(true);
    };
    const cancel = (event: PointerEvent) => {
      if (event.pointerId === start.pointerId) finish(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };
    const away = () => finish(false);
    const selection = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    window.getSelection()?.removeAllRanges();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", away);
    return () => {
      document.body.style.userSelect = selection;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", away);
    };
    // Bound once per gesture; changing values are read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A list taller than the screen scrolls while the pointer rests near an edge.
  const scrolls = Boolean(layout && layout.max > 0 && dropped === null);
  useEffect(() => {
    if (!scrolls) return;
    let frame = requestAnimationFrame(function step() {
      const { layout, pointer } = live.current;
      if (layout) {
        const scroll = Math.max(
          0,
          Math.min(
            layout.max,
            pointer.scroll +
              edgeScroll(pointer.y - layout.areaTop, layout.top, layout.bottom),
          ),
        );
        if (scroll !== pointer.scroll) {
          live.current.pointer = { ...pointer, scroll };
          setPointer(live.current.pointer);
        }
      }
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrolls]);

  if (!layout) return null;
  const dy = pointer.y - start.y + pointer.scroll - layout.startScroll;
  const to = dropped ?? dropTarget(layout.heights, GAP, from, dy);
  const { tops } = stackRows(layout.heights, GAP);
  return createPortal(
    <div
      className="workout-reorder"
      data-open={open || undefined}
      data-dropped={dropped === null ? undefined : true}
      aria-hidden="true"
      style={{ top: layout.areaTop }}
    >
      {blocks.map((block, index) => {
        const held = index === from;
        const follow = held && dropped === null;
        const shift = follow
          ? dy
          : slotShift(layout.heights, GAP, from, to, index);
        return (
          <div
            key={block.key}
            className="workout-reorder-slot"
            data-held={held || undefined}
            style={{
              top: layout.start + tops[index]! - pointer.scroll,
              left: layout.left,
              width: layout.width,
              height: layout.heights[index],
              transform: `translateY(${open ? 0 : layout.origins[index]}px)`,
            }}
          >
            <div
              className="workout-reorder-row"
              data-follow={follow || undefined}
              // Dimmed while only pressed, solid once it is on the move.
              data-dimmed={(follow && Math.abs(dy) < 6) || undefined}
              style={
                {
                  transform: `translateY(${shift}px)`,
                  "--reorder-row": `${layout.row}px`,
                } as CSSProperties
              }
            >
              {block.superset && <small>{t("Superserie", "Superset")}</small>}
              {block.members.map((member, position) => (
                <div key={position} className="workout-reorder-member">
                  <span className="workout-reorder-thumb">
                    {member.exercise && (
                      <ExerciseVisual exercise={member.exercise} />
                    )}
                  </span>
                  <strong>{member.name}</strong>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
