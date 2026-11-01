"use client";
import { useSwipeNavigation } from "@/lib/browser/use-swipe-navigation";
import { useRef, useState } from "react";
import { useClock } from "./clock-provider";
import { useApp } from "@/state/app-provider";
import { timeFormat } from "@fitty/core/domain/combat";
import { RouteMap } from "./route-map";
import { TrackingHistory } from "./tracking-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
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
      : clock.sw.elapsed,
    track = clock.track,
    distance =
      snapshot.settings.distance === "mi"
        ? track.distance / 1609.344
        : track.distance / 1000;
  const kg =
      Number(snapshot.profile.weight ?? 75) /
      (snapshot.settings.weight === "lb" ? 2.20462 : 1),
    speed = track.running
      ? clock.now - track.fixTime <= 10000
        ? track.currentSpeed
        : 0
      : track.elapsed
        ? track.distance / track.elapsed
        : 0,
    pace =
      speed >= 0.5
        ? track.mode === "cycle"
          ? `${(speed * (snapshot.settings.distance === "mi" ? 2.236936 : 3.6)).toFixed(1)} ${snapshot.settings.distance === "mi" ? "mph" : "km/h"}`
          : `${timeFormat((snapshot.settings.distance === "mi" ? 1609.344 : 1000) / speed)} /${snapshot.settings.distance}`
        : "—";
  const swipe = useSwipeNavigation((direction) => {
    const tabs = ["stopwatch", "timer", "combat", "tracking"];
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
          ["tracking", "Tracking"],
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
          <div className="flex justify-center gap-3">
            <Button onClick={clock.toggleSw}>
              {clock.sw.running ? t("Pausar", "Pause") : t("Iniciar", "Start")}
            </Button>
            <Button variant="secondary" onClick={clock.resetSw}>
              {t("Reiniciar", "Reset")}
            </Button>
          </div>
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
          <div className="flex justify-center gap-3">
            <Button onClick={clock.toggleTimer}>
              {clock.timer.running
                ? t("Pausar", "Pause")
                : clock.timer.remaining > 0 && clock.timer.remaining < chosen
                  ? t("Continuar", "Resume")
                  : t("Iniciar", "Start")}
            </Button>
            <Button variant="secondary" onClick={() => clock.preset(chosen)}>
              {t("Reiniciar", "Reset")}
            </Button>
          </div>
        </section>
      )}
      {clock.section === "combat" && (
        <section className="panel">
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
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={clock.toggleCombat}>
              {combat.state.running
                ? t("Pausar", "Pause")
                : t("Iniciar", "Start")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => clock.configureCombat(combat.config)}
            >
              {t("Reiniciar", "Reset")}
            </Button>
          </div>
        </section>
      )}
      {clock.section === "tracking" && (
        <section className="panel">
          <div className="my-3 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => clock.configureTrack({ mode: "run" })}
            >
              {t("Correr", "Running")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => clock.configureTrack({ mode: "cycle" })}
            >
              {t("Ciclismo", "Cycling")}
            </Button>
          </div>
          <label>
            {t("Preparación inicial (seg)", "Initial preparation (sec)")}
            <NumericInput
              type="number"
              min={0}
              max={600}
              value={track.prep}
              disabled={track.running || track.preparing}
              onChange={(event) =>
                clock.configureTrack({
                  prep: Math.max(0, Math.min(600, Number(event.target.value))),
                })
              }
            />
          </label>
          {track.preparing && (
            <p className="my-3">
              {t("Preparación:", "Preparation:")}
              {timeFormat((track.prepEnd - clock.now) / 1000)}
            </p>
          )}
          <RouteMap
            key={track.saved ? "saved" : "active"}
            points={track.points}
            live={track.running}
            locateOnOpen
          />
          {track.error && <p role="alert">{track.error}</p>}
          <div className="metric-grid">
            <div>
              <strong>{timeFormat(track.elapsed)}</strong>
              <small>{t("Tiempo", "Time")}</small>
            </div>
            <div>
              <strong>
                {distance.toFixed(2)} {snapshot.settings.distance}
              </strong>
              <small>{t("Distancia", "Distance")}</small>
            </div>
            <div>
              <strong>{pace}</strong>
              <small>{track.mode === "cycle" ? "Velocidad" : "Ritmo"}</small>
            </div>
            <div>
              <strong>
                {Math.round(
                  ((track.mode === "run" ? 9.8 : 7.5) * kg * track.elapsed) /
                    3600,
                )}{" "}
                kcal
              </strong>
              <small>{t("Estimación", "Estimate")}</small>
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={clock.toggleTrack}>
              {track.preparing
                ? "Cancelar preparación"
                : track.running
                  ? "Finalizar"
                  : "Iniciar GPS"}
            </Button>
            <Button
              variant="secondary"
              disabled={track.running || track.preparing}
              onClick={clock.resetTrack}
            >
              {t("Reiniciar", "Reset")}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t(
              "Finalizá la actividad para guardar el recorrido. Mantené la app visible: el navegador puede limitar el GPS en segundo plano.",
              "Finish the activity to save the route. Keep the app visible: the browser may limit GPS in the background.",
            )}
          </p>
          <TrackingHistory />
        </section>
      )}
    </div>
  );
}
