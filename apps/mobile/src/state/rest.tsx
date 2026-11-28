import * as Haptics from "expo-haptics";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { playRestDone } from "@/lib/sound";
import { useSnapshot } from "@/state/account";

export type Rest = {
  end: number;
  seconds: number;
  /** The set whose clock started it. */
  source?: string;
};

/** How long the set that just finished resting stays highlighted. */
export const REST_GLOW_MS = 1800;

const Context = createContext<{
  rest: Rest | null;
  /** The `source` of a rest that has just run out (never of a skipped one). */
  finished: string | null;
  start: (seconds: number, source?: string) => void;
  stop: () => void;
} | null>(null);

/** The rest between sets of the workout in progress, shown on every tab. */
export function RestProvider({ children }: { children: ReactNode }) {
  const working = Boolean(useSnapshot().workout);
  const [rest, setRest] = useState<Rest | null>(null);
  const [finished, setFinished] = useState<string | null>(null);
  const start = useCallback((seconds: number, source?: string) => {
    setFinished(null);
    setRest({ end: Date.now() + seconds * 1000, seconds, source });
  }, []);
  const stop = useCallback(() => setRest(null), []);
  useEffect(() => {
    if (!rest) return;
    const timer = setTimeout(
      () => {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        playRestDone();
        setFinished(rest.source ?? null);
        setRest(null);
      },
      Math.max(0, rest.end - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [rest]);
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => setFinished(null), REST_GLOW_MS);
    return () => clearTimeout(timer);
  }, [finished]);
  // A rest ends with its workout, so it never announces itself later.
  useEffect(() => {
    if (!working) setRest(null);
  }, [working]);
  const value = useMemo(
    () => ({
      rest: working ? rest : null,
      finished: working ? finished : null,
      start,
      stop,
    }),
    [working, rest, finished, start, stop],
  );
  return <Context value={value}>{children}</Context>;
}

export function useRest() {
  const value = use(Context);
  if (!value) throw new Error("Rest unavailable");
  return value;
}
