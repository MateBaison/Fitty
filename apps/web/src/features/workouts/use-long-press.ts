"use client";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

const HOLD_MS = 450;
/** Finger movement that turns a hold into a scroll. */
const SLACK_PX = 10;

/** The pointer that is still down when a long press starts. */
export type HeldPointer = { pointerId: number; y: number };

/**
 * Handlers for an element that can be held still and then dragged. Alt + arrows
 * do the same one step at a time for keyboard users. A normal press keeps its
 * own behavior; the click that ends a long press is swallowed.
 */
export function useLongPress() {
  const press = useRef({
    timer: 0,
    x: 0,
    y: 0,
    pointerId: 0,
    touch: false,
    fired: false,
    held: false,
  });
  const clear = () => window.clearTimeout(press.current.timer);
  useEffect(() => {
    // Registered ahead of any touch: a listener added mid-gesture cannot stop
    // the page from scrolling under a finger that is dragging.
    const holdPage = (event: TouchEvent) => {
      if (press.current.held && event.cancelable) event.preventDefault();
    };
    const release = () => {
      press.current.held = false;
    };
    document.addEventListener("touchmove", holdPage, { passive: false });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      clear();
      document.removeEventListener("touchmove", holdPage);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);
  return (
    onHold: (pointer: HeldPointer) => void,
    onStep: (direction: -1 | 1) => void,
  ) => {
    // Dialogs rendered inside the element bubble their events here too.
    const own = (event: { currentTarget: Element; target: EventTarget }) =>
      event.currentTarget.contains(event.target as Node) &&
      !(event.target as Element).closest(".exercise-menu-trigger");
    const fire = () => {
      clear();
      if (press.current.held) return;
      press.current.fired = true;
      press.current.held = true;
      onHold({ pointerId: press.current.pointerId, y: press.current.y });
    };
    return {
      onPointerDown: (event: PointerEvent) => {
        if (!own(event)) return;
        clear();
        press.current.fired = false;
        press.current.held = false;
        if (event.button !== 0) return;
        press.current = {
          timer: window.setTimeout(fire, HOLD_MS),
          x: event.clientX,
          y: event.clientY,
          pointerId: event.pointerId,
          touch: event.pointerType !== "mouse",
          fired: false,
          held: false,
        };
      },
      onPointerMove: (event: PointerEvent) => {
        if (
          Math.hypot(
            event.clientX - press.current.x,
            event.clientY - press.current.y,
          ) > SLACK_PX
        )
          clear();
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onClickCapture: (event: MouseEvent) => {
        if (!own(event) || !press.current.fired) return;
        press.current.fired = false;
        // A keyboard click (detail 0) never ends a long press.
        if (event.detail === 0) return;
        event.preventDefault();
        event.stopPropagation();
      },
      // Phones open their own menu on a long press; ours takes its place.
      onContextMenu: (event: MouseEvent) => {
        if (!own(event) || !press.current.touch) return;
        event.preventDefault();
        fire();
      },
      // A mouse drag must move the exercise, not a ghost of its picture.
      onDragStart: (event: SyntheticEvent) => event.preventDefault(),
      onKeyDown: (event: KeyboardEvent) => {
        if (
          !own(event) ||
          !event.altKey ||
          (event.key !== "ArrowUp" && event.key !== "ArrowDown")
        )
          return;
        event.preventDefault();
        onStep(event.key === "ArrowUp" ? -1 : 1);
      },
    };
  };
}
