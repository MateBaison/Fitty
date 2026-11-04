import { useSyncExternalStore } from "react";

// The short app tour is shown once per account on this phone.
const key = (userId: string) => `fitty-intro-${userId}`;
const listeners = new Set<() => void>();

function seen(userId: string) {
  try {
    return localStorage.getItem(key(userId)) === "1";
  } catch {
    return true;
  }
}

export function setIntroSeen(userId: string, value: boolean) {
  try {
    if (value) localStorage.setItem(key(userId), "1");
    else localStorage.removeItem(key(userId));
  } catch {
    // Storage unavailable: the tour is simply skipped.
  }
  listeners.forEach((listener) => listener());
}

export function useIntroSeen(userId: string) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    () => seen(userId),
  );
}
