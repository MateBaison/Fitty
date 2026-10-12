"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session } from "@/domain/workouts";
import { CombatAudio } from "@/lib/browser/combat-audio";
type Rest = { end: number; duration: number };
const Context = createContext<{
  now: number;
  rest: Rest;
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
    callback = useRef(onRestComplete);
  callback.current = onRestComplete;
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
