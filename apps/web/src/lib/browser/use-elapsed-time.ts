import { useEffect, useState } from "react";
import { timeFormat } from "@fitty/core/domain/combat";

/**
 * Clock since a moment, updated every second. Shows dashes until it runs in the
 * browser, so the server render matches.
 */
export function useElapsedTime(started: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return now !== null && Number.isFinite(started)
    ? timeFormat((now - started) / 1000)
    : "--:--";
}
