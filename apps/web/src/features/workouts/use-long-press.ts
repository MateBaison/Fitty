"use client";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

const HOLD_MS = 450;
/** Finger movement that turns a hold into a scroll. */
const SLACK_PX = 10;

/**
 * Handlers for an element that does something when held still. Right click and
 * Alt + arrows do the same for mouse and keyboard users. A normal press keeps
 * its own behavior; the click that ends a long press is swallowed.
 */
export function useLongPress() {
  const press = useRef({ timer: 0, x: 0, y: 0, fired: false });
  const clear = () => window.clearTimeout(press.current.timer);
  useEffect(() => clear, []);
  return (onLongPress: () => void) => {
    // Dialogs rendered inside the element bubble their events here too.
    const own = (event: { currentTarget: Element; target: EventTarget }) =>
      event.currentTarget.contains(event.target as Node) &&
      !(event.target as Element).closest(".exercise-menu-trigger");
    const fire = () => {
      clear();
      press.current.fired = true;
      onLongPress();
    };
    return {
      onPointerDown: (event: PointerEvent) => {
        if (!own(event)) return;
        clear();
        press.current.fired = false;
        if (event.button !== 0) return;
        press.current = {
          timer: window.setTimeout(fire, HOLD_MS),
          x: event.clientX,
          y: event.clientY,
          fired: false,
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
      onContextMenu: (event: MouseEvent) => {
        if (!own(event)) return;
        event.preventDefault();
        fire();
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (
          !own(event) ||
          !event.altKey ||
          (event.key !== "ArrowUp" && event.key !== "ArrowDown")
        )
          return;
        event.preventDefault();
        onLongPress();
      },
    };
  };
}
