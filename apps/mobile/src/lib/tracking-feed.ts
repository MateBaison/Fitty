import type { LocationObject } from "expo-location";

export const TRACKING_TASK = "fitty-tracking";

type Listener = (positions: LocationObject[]) => void;
let listener: Listener | null = null;
let buffer: LocationObject[] = [];

/** Receives GPS fixes from the background task; fixes that arrive while no screen listens wait here. */
export function setTrackingListener(next: Listener | null) {
  listener = next;
  if (next && buffer.length) {
    const waiting = buffer;
    buffer = [];
    next(waiting);
  }
}

export function clearTrackingBuffer() {
  buffer = [];
}

// The task is native: a build made before expo-task-manager was added simply
// has no background tracking and the screen falls back to foreground updates.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager = require("expo-task-manager") as typeof import("expo-task-manager");
  TaskManager.defineTask<{ locations?: LocationObject[] }>(
    TRACKING_TASK,
    async ({ data, error }) => {
      if (error || !data?.locations?.length) return;
      if (listener) listener(data.locations);
      else buffer.push(...data.locations);
    },
  );
} catch {
  // Background tracking unavailable in this build.
}
