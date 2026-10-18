"use client";
import { useRef, type PointerEvent } from "react";
export type SwipeDirection = "previous" | "next";
export function swipeDirection(
  dx: number,
  dy: number,
  elapsed: number,
): SwipeDirection | null {
  if (
    elapsed > 900 ||
    Math.abs(dx) < 65 ||
    Math.abs(dx) < Math.abs(dy) * 1.8 ||
    Math.abs(dy) > 45
  )
    return null;
  return dx > 0 ? "previous" : "next";
}
/** Inner navigation consumes a gesture only when it can move; outer navigation handles its edges. */
export function useSwipeNavigation(
  move: (direction: SwipeDirection) => boolean,
) {
  const start = useRef<{ x: number; y: number; at: number; id: number } | null>(
    null,
  );
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      start.current = null;
      if (
        event.pointerType !== "touch" ||
        !event.isPrimary ||
        event.clientX > window.innerWidth - 24 ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        !target ||
        target.closest(
          'form,input,select,textarea,button,a,summary,[contenteditable="true"],[role="slider"],[draggable="true"],[data-no-swipe],.leaflet-container,.maplibregl-map',
        )
      )
        return;
      for (
        let element: Element | null = target;
        element && element !== event.currentTarget;
        element = element.parentElement
      ) {
        if (
          element.scrollWidth > element.clientWidth + 2 &&
          ["auto", "scroll"].includes(getComputedStyle(element).overflowX)
        )
          return;
      }
      start.current = {
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        id: event.pointerId,
      };
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const value = start.current;
      start.current = null;
      if (!value || value.id !== event.pointerId) return;
      const direction = swipeDirection(
        event.clientX - value.x,
        event.clientY - value.y,
        performance.now() - value.at,
      );
      if (direction && move(direction)) event.stopPropagation();
    },
    onPointerCancel() {
      start.current = null;
    },
  };
}
