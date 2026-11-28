import { useEffect, useState } from "react";
import { timeFormat } from "@fitty/core/domain/combat";

/** Clock since a moment, updated every second. */
export function useElapsedTime(started: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [started]);
  return Number.isFinite(started)
    ? timeFormat((now - started) / 1000)
    : "--:--";
}
