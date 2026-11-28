"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session } from "@fitty/core/domain/workouts";
import { CombatAudio } from "@/lib/browser/combat-audio";
/** `source` names the set whose clock started the rest. */
type Rest = { end: number; duration: number; source?: string };
/** How long the set that just finished resting stays highlighted. */
export const REST_GLOW_MS = 1800;
const Context = createContext<{
  now: number;
  rest: Rest;
  /** The `source` of a rest that has just run out (never of a skipped one). */
  finished: string | undefined;
  setRest: (value: Rest) => void;
  clipboard: Session[];
  setClipboard: (value: Session[]) => void;
} | null>(null);
export function RuntimeProvider({
  children,
  onRestComplete,
}: {
  children: React.ReactNode;
  onRestComplete: () => void;
}) {
  const [clipboard, setClipboard] = useState<Session[]>([]);
  const [now, setNow] = useState(Date.now()),
    [rest, updateRest] = useState<Rest>({ end: 0, duration: 0 }),
    announced = useRef(0),
    callback = useRef(onRestComplete),
    source = useRef(rest.source);
  callback.current = onRestComplete;
  source.current = rest.source;
  const [finished, setFinished] = useState<string>();
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => setFinished(undefined), REST_GLOW_MS);
    return () => clearTimeout(timer);
  }, [finished]);
  const audio = useRef(new CombatAudio());
  useEffect(() => () => audio.current.close(), []);
  useEffect(() => {
    if (!rest.end) return;
    const update = () => {
      const time = Date.now();
      setNow(time);
      if (time >= rest.end && announced.current !== rest.end) {
        announced.current = rest.end;
        navigator.vibrate?.([120, 70, 120]);
        void audio.current.play("timer").catch(() => {});
        callback.current();
        setFinished(source.current);
      }
    };
    update();
    if (Date.now() >= rest.end) return;
    const timer = setInterval(() => {
      update();
      if (Date.now() >= rest.end) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [rest.end]);
  return (
    <Context.Provider
      value={{
        now,
        rest,
        finished,
        clipboard,
        setClipboard,
        setRest: (value) => {
          if (value.end > Date.now()) {
            void audio.current
              .unlock()
              .then(() => audio.current.play("warning"))
              .catch(() => {});
          }
          setNow(Date.now());
          setFinished(undefined);
          updateRest(value);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useRuntime() {
  const value = useContext(Context);
  if (!value) throw new Error("Runtime unavailable");
  return value;
}
