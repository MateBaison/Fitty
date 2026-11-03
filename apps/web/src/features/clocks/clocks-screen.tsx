"use client";
import { useSwipeNavigation } from "@/lib/browser/use-swipe-navigation";
import { useRef, useState } from "react";
import { useClock } from "./clock-provider";
import { useApp } from "@/state/app-provider";
import { combatTone, timeFormat } from "@fitty/core/domain/combat";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
/** Icon controls: stop shows on the left only while running or paused. */
function ClockControls({
  running,
  active,
  resumable = false,
  onToggle,
  onStop,
  onReset,
}: {
  running: boolean;
  active: boolean;
  resumable?: boolean;
  onToggle: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const { t } = useApp();
  return (
    <div className="clock-controls">
      <span className="clock-controls-side">
        {active && (
          <Button
            variant="secondary"
            size="icon"
            className="clock-stop"
            aria-label={t("Detener", "Stop")}
            onClick={onStop}
          >
            <Square aria-hidden="true" />
          </Button>
        )}
      </span>
      <Button
        className="clock-main-button"
        size="icon"
        aria-label={
          running
            ? t("Pausar", "Pause")
            : resumable
              ? t("Continuar", "Resume")
              : t("Iniciar", "Start")
        }
        onClick={onToggle}
      >
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        aria-label={t("Reiniciar", "Reset")}
        onClick={onReset}
      >
        <RotateCcw aria-hidden="true" />
      </Button>
    </div>
  );
}
export function ClocksScreen() {
  const [editingTimer, setEditingTimer] = useState(false);
  const [chosen, setChosen] = useState(60);
  const presets = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [duration, setDuration] = useState({
    hours: "0",
    minutes: "0",
    seconds: "30",
  });
  const clock = useClock(),
    { snapshot, t } = useApp(),
    combat = clock.combat,
    phase = combat.state.phase;
  const elapsed = clock.sw.running
      ? clock.now - clock.sw.started
      : clock.sw.elapsed;
  const swipe = useSwipeNavigation((direction) => {
    const tabs = ["stopwatch", "timer", "combat"];
    const next =
      tabs[tabs.indexOf(clock.section) + (direction === "next" ? 1 : -1)];
    if (!next) return false;
    clock.setSection(next);
    return true;
  });
  return (
    <div className="swipe-navigation" {...swipe}>
      <div className="muscle-chips">
        {[
          ["stopwatch", "Cronómetro"],
          ["timer", "Timer"],
          ["combat", "Combate"],
        ].map(([id, name]) => (
          <button
            key={id}
            aria-pressed={clock.section === id}
            onClick={() => {
              if (id) clock.setSection(id);
            }}
          >
            {t(
              name ?? "",
              name === "Cronómetro"
                ? "Stopwatch"
                : name === "Combate"
                  ? "Combat"
                  : (name ?? ""),
            )}
          </button>
        ))}
      </div>
      {clock.section === "stopwatch" && (
        <section className="panel">
          <div
            className="clock-face"
            role="timer"
            aria-label={t("Cronómetro", "Stopwatch")}
          >
            {timeFormat(elapsed / 1000)}
          </div>
          <ClockControls
            running={clock.sw.running}
            active={clock.sw.running || elapsed > 0}
            onToggle={clock.toggleSw}
            onStop={clock.resetSw}
            onReset={clock.resetSw}
          />
        </section>
      )}
      {clock.section === "timer" && (
        <section className="panel">
          <div
            className="clock-face"
            role="timer"
            aria-label={t("Timer", "Timer")}
          >
            {editingTimer ? (
              <form
                className="timer-inline-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  const seconds =
                    Number(duration.hours) * 3600 +
                    Number(duration.minutes) * 60 +
                    Number(duration.seconds);
                  if (Number.isInteger(seconds) && seconds > 0) {
                    clock.preset(seconds);
                    setChosen(seconds);
                  }
                  setEditingTimer(false);
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    event.currentTarget.requestSubmit();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setEditingTimer(false);
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.requestSubmit();
                  }
                }}
              >
                {(
                  [
                    ["hours", t("Horas", "Hours")],
                    ["minutes", t("Minutos", "Minutes")],
                    ["seconds", t("Segundos", "Seconds")],
                  ] as const
                ).map(([key, label], index) => (
                  <span key={key}>
                    {index > 0 && <b aria-hidden="true">:</b>}
                    <input
                      type="text"
                      inputMode="numeric"
                      className={key === "hours" ? "timer-hours" : undefined}
                      aria-label={label}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus={key === "minutes"}
                      maxLength={3}
                      value={duration[key]}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) =>
                        setDuration((previous) => ({
                          ...previous,
                          [key]: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </span>
                ))}
              </form>
            ) : (
              <button
                type="button"
                className="timer-duration-button"
                aria-label={t("Editar tiempo del timer", "Edit timer duration")}
                onClick={() => {
                  const seconds = Math.ceil(clock.timer.remaining);
                  setDuration({
                    hours: String(Math.floor(seconds / 3600)),
                    minutes: String(Math.floor(seconds / 60) % 60),
                    seconds: String(seconds % 60),
                  });
                  setEditingTimer(true);
                }}
              >
                {timeFormat(clock.timer.remaining)}
              </button>
            )}
          </div>
          <div
            ref={presets}
            className="timer-presets"
            role="group"
            aria-label={t("Tiempos predeterminados", "Preset times")}
            onWheel={(event) => {
              if (presets.current && Math.abs(event.deltaY) > Math.abs(event.deltaX))
                presets.current.scrollLeft += event.deltaY;
            }}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse" || !presets.current) return;
              drag.current = {
                x: event.clientX,
                left: presets.current.scrollLeft,
                moved: false,
              };
            }}
            onPointerMove={(event) => {
              const state = drag.current;
              if (!state || !presets.current) return;
              const delta = event.clientX - state.x;
              if (Math.abs(delta) > 4) state.moved = true;
              if (state.moved) presets.current.scrollLeft = state.left - delta;
            }}
            onPointerUp={() => {
              window.setTimeout(() => (drag.current = null), 0);
            }}
            onPointerLeave={() => (drag.current = null)}
            onClickCapture={(event) => {
              if (drag.current?.moved) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {[
              [15, "15seg"],
              [30, "30seg"],
              [45, "45seg"],
              [60, "1min"],
              [90, "1:30"],
              [120, "2min"],
              [180, "3min"],
              [300, "5min"],
              [600, "10min"],
            ].map(([seconds, label]) => (
              <Button
                variant={chosen === seconds ? "default" : "secondary"}
                key={seconds}
                onClick={() => {
                  clock.preset(Number(seconds));
                  setChosen(Number(seconds));
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <ClockControls
            running={clock.timer.running}
            active={
              clock.timer.running ||
              (clock.timer.remaining > 0 && clock.timer.remaining < chosen)
            }
            resumable={
              !clock.timer.running &&
              clock.timer.remaining > 0 &&
              clock.timer.remaining < chosen
            }
            onToggle={clock.toggleTimer}
            onStop={() => clock.preset(chosen)}
            onReset={() => clock.preset(chosen)}
          />
        </section>
      )}
      {clock.section === "combat" && (
        <section className="panel">
          <div
            className="combat-frame"
            data-tone={combatTone(combat.state, combat.config)}
          >
          <p className="text-center text-orange-300">
            {phase === "done"
              ? t("Sesión terminada", "Session finished")
              : phase === "prep"
                ? t("Preparación", "Preparation")
                : phase === "work"
                  ? t("Trabajo", "Work")
                  : t("Descanso", "Rest")}{" "}
            {t("· Ronda", "· Round")} {combat.state.round}/
            {combat.config.rounds}
          </p>
          <div
            className="clock-face combat-face"
            role="timer"
            aria-label={t("Combate", "Combat")}
          >
            {timeFormat(combat.state.remaining)}
          </div>
          </div>
          <div className="form-grid">
            {(["rounds", "work", "rest", "prep"] as const).map(
              (field, index) => (
                <label key={field}>
                  {t(
                    [
                      "Rondas",
                      "Trabajo (seg)",
                      "Descanso (seg)",
                      "Preparación (seg)",
                    ][index]!,
                    ["Rounds", "Work (sec)", "Rest (sec)", "Preparation (sec)"][
                      index
                    ]!,
                  )}
                  <NumericInput
                    type="number"
                    min={field === "rounds" || field === "work" ? 1 : 0}
                    max={
                      field === "rounds" ? 100 : field === "prep" ? 600 : 3600
                    }
                    value={combat.config[field]}
                    disabled={combat.state.running}
                    onChange={(event) =>
                      clock.configureCombat({
                        ...combat.config,
                        [field]: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ),
            )}
          </div>
          <div className="mt-5">
            <ClockControls
              running={combat.state.running}
              active={combat.state.running}
              onToggle={clock.toggleCombat}
              onStop={() => clock.configureCombat(combat.config)}
              onReset={() => clock.configureCombat(combat.config)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
