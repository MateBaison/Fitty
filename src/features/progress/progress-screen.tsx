"use client";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Trophy,
  Activity,
  Dumbbell,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPanel } from "@/features/calendar/calendar-panel";
import { catalogFor, localDateKey, validDateKey } from "@/domain/workouts";
import {
  exerciseHistories,
  recentImprovements,
  weeklySummary,
} from "@/domain/progress";
import { recordPanel } from "@/domain/personal-records";
import {
  progressRange,
  periodSessions,
  progressTotals,
  muscleTotals,
  newRecordCount,
  type ProgressPeriod,
} from "@/domain/progress-period";
import { ProgressChart, type ChartPoint } from "./progress-chart";
import { shareWorkoutPoster } from "@/features/sharing/workout-poster";
import { BodyProgress } from "./body-progress";
const periods = [
  ["week", "Semana", "Week"],
  ["month", "Mes", "Month"],
  ["quarter", "3 meses", "3 months"],
  ["year", "Año", "Year"],
  ["all", "Todo", "All"],
] as const;
export function ProgressScreen() {
  const { snapshot, t, notify } = useApp();
  const [tab, setTab] = useState<"summary" | "exercises" | "body">("summary"),
    [period, setPeriod] = useState<ProgressPeriod>("week"),
    [anchor, setAnchor] = useState(() => new Date()),
    [selected, setSelected] = useState(""),
    [metric, setMetric] = useState("weight"),
    [warmups, setWarmups] = useState(false),
    [day, setDay] = useState<string | null>(null);
  const unit = snapshot.settings.weight ?? "kg",
    factor = unit === "lb" ? 2.20462 : 1,
    locale = snapshot.settings.language ?? "es";
  const range = progressRange(period, anchor),
    chosenSessions = periodSessions(snapshot, range),
    scoped = { ...snapshot, sessions: chosenSessions },
    totals = progressTotals(scoped);
  const previousAnchor = new Date(anchor);
  if (period === "week") previousAnchor.setDate(previousAnchor.getDate() - 7);
  else if (period === "month")
    previousAnchor.setMonth(previousAnchor.getMonth() - 1, 1);
  else if (period === "quarter")
    previousAnchor.setMonth(previousAnchor.getMonth() - 3, 1);
  else previousAnchor.setFullYear(previousAnchor.getFullYear() - 1);
  const previous = progressTotals({
    ...snapshot,
    sessions: periodSessions(snapshot, progressRange(period, previousAnchor)),
  });
  const catalog = catalogFor(snapshot, true),
    histories = useMemo(
      () => exerciseHistories(snapshot, warmups),
      [snapshot, warmups],
    ),
    recordedCatalog = catalog.filter((e) => histories.has(e.id));
  const selectedId = selected || recordedCatalog[0]?.id || "",
    selectedExercise = catalog.find((e) => e.id === selectedId);
  const history = (histories.get(selectedId) ?? []).filter(
    (r) => r.date >= range.start && r.date < range.end,
  );
  const allRecords = useMemo(() => recordPanel(snapshot), [snapshot]),
    bestRecords = allRecords.filter(
      (r) =>
        r.exerciseId === selectedId &&
        new Date(r.date) >= range.start &&
        new Date(r.date) < range.end,
    );
  const advances = recentImprovements(snapshot).filter(
    (a) => a.date >= range.start && a.date < range.end,
  );
  const newRecords = useMemo(
    () => newRecordCount(snapshot, chosenSessions),
    [snapshot, period, anchor],
  );
  const counts = muscleTotals(scoped),
    muscles = Object.entries(counts).sort((a, b) => b[1] - a[1]),
    max = Math.max(1, ...Object.values(counts));
  const weekly = weeklySummary(snapshot, anchor),
    activeDays = snapshot.routines.find((r) => r.id === snapshot.selected)?.days
      .length;
  const move = (direction: number) => {
    const next = new Date(anchor);
    if (period === "week") next.setDate(next.getDate() + direction * 7);
    else if (period === "year")
      next.setFullYear(next.getFullYear() + direction);
    else
      next.setMonth(
        next.getMonth() + direction * (period === "quarter" ? 3 : 1),
        1,
      );
    setAnchor(next);
  };
  const duration = (minutes: number) =>
    `${Math.floor(minutes / 60)} h ${Math.round(minutes % 60)} min`;
  const formatSet = (weight: number, quantity: number, metric: string) =>
    `${(weight * factor).toLocaleString(locale, { maximumFractionDigits: 1 })} ${unit} × ${quantity} ${metric === "seconds" ? "s" : t("Rep", "Reps")}`;
  const points: ChartPoint[] = history.flatMap((r) => {
    const sets = r.sets.filter((s) =>
      metric === "seconds"
        ? s.metric === "seconds"
        : metric === "reps" || metric === "volume"
          ? s.metric === "reps"
          : true,
    );
    if (!sets.length) return [];
    return [
      {
        date: r.date,
        value:
          metric === "weight"
            ? Math.max(...sets.map((s) => s.kg * factor))
            : metric === "volume"
              ? sets.reduce((n, s) => n + s.kg * factor * s.value, 0)
              : Math.max(...sets.map((s) => s.value)),
        detail:
          metric === "weight"
            ? formatSet(
                ...(() => {
                  const s = [...sets].sort(
                    (a, b) => b.kg - a.kg || b.value - a.value,
                  )[0]!;
                  return [s.kg, s.value, s.metric] as const;
                })(),
              )
            : undefined,
      },
    ];
  });
  const metricLabel =
    metric === "weight"
      ? t("Carga máxima", "Maximum load")
      : metric === "reps"
        ? t("Repeticiones máximas por serie", "Maximum repetitions per set")
        : metric === "seconds"
          ? t("Segundos máximos por serie", "Maximum seconds per set")
          : t("Volumen", "Volume");
  const delta = (now: number, before: number) =>
    period === "all"
      ? null
      : before > 0
        ? `${now >= before ? "+" : ""}${Math.round(((now - before) / before) * 100)}%`
        : now > 0
          ? t("Primer registro", "First entry")
          : "—";
  return (
    <div className="progress-dashboard">
      {day && (
        <CalendarPanel
          key={day}
          initialDate={day}
          dialogOnly
          onClose={() => setDay(null)}
        />
      )}
      <div className="progress-intro">
        <div>
          <span className="eyebrow">{t("Tu recorrido", "Your journey")}</span>
          <h2>{t("Cada entrenamiento cuenta", "Every workout counts")}</h2>
          <p>
            {t(
              "Mirá lo que hiciste y cómo venís avanzando.",
              "See what you did and how you are progressing.",
            )}
          </p>
        </div>
        <Activity aria-hidden="true" />
      </div>
      <div
        className="progress-tabs"
        role="group"
        aria-label={t("Secciones de progreso", "Progress sections")}
      >
        {(
          [
            ["summary", "Resumen", "Summary"],
            ["exercises", "Ejercicios", "Exercises"],
            ["body", "Cuerpo", "Body"],
          ] as const
        ).map(([id, es, en]) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "ghost"}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {t(es, en)}
          </Button>
        ))}
      </div>
      <section
        className="progress-period"
        aria-label={t("Período de progreso", "Progress period")}
      >
        <div className="progress-period-options">
          {periods.map(([id, es, en]) => (
            <Button
              key={id}
              size="sm"
              variant={period === id ? "secondary" : "ghost"}
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
            >
              {t(es, en)}
            </Button>
          ))}
        </div>
        {period !== "all" && (
          <div className="progress-period-navigation">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("Período anterior", "Previous period")}
              onClick={() => move(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <label className="sr-only" htmlFor="progress-date">
              {t("Fecha de referencia", "Reference date")}
            </label>
            <Input
              id="progress-date"
              type="date"
              value={localDateKey(period === "week" ? range.start : anchor)}
              onChange={(e) => {
                if (validDateKey(e.target.value))
                  setAnchor(new Date(`${e.target.value}T12:00:00`));
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("Período siguiente", "Next period")}
              onClick={() => move(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchor(new Date())}
            >
              {t("Hoy", "Today")}
            </Button>
          </div>
        )}
        <p className="progress-date-range">
          {period === "all"
            ? t("Todos los entrenamientos registrados", "All recorded workouts")
            : `${range.start.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })} — ${new Date(range.end.getTime() - 1).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`}
        </p>
      </section>
      {tab === "summary" && (
        <>
          <section aria-labelledby="progress-summary-title">
            <div className="progress-section-heading">
              <h2 id="progress-summary-title">
                {period === "week"
                  ? t("Resumen semanal", "Weekly summary")
                  : period === "month"
                    ? t("Resumen mensual", "Monthly summary")
                    : t("Resumen del período", "Period summary")}
              </h2>
            </div>
            <div className="progress-stats">
              {[
                {
                  label: t("Entrenamientos", "Workouts"),
                  value: `${totals.sessions}${period === "week" && activeDays ? `/${activeDays}` : ""}`,
                  delta: delta(totals.sessions, previous.sessions),
                  icon: CalendarDays,
                },
                {
                  label: t("Tiempo registrado", "Recorded time"),
                  value: duration(totals.minutes),
                  delta: delta(totals.minutes, previous.minutes),
                  icon: Clock,
                },
                {
                  label: t("Series", "Sets"),
                  value: totals.sets.toLocaleString(locale),
                  delta: delta(totals.sets, previous.sets),
                  icon: Dumbbell,
                },
                {
                  label: t("Nuevos récords", "New records"),
                  value: newRecords.toLocaleString(locale),
                  delta: null,
                  icon: Trophy,
                },
              ].map((card) => (
                <article className="progress-stat" key={card.label}>
                  <card.icon aria-hidden="true" />
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  {card.delta && (
                    <small>
                      {card.delta}{" "}
                      {t("vs. período anterior", "vs. previous period")}
                    </small>
                  )}
                </article>
              ))}
            </div>
          </section>
          {period === "week" && (
            <div className="progress-week-days">
              {weekly.days.map((d) => (
                <button
                  type="button"
                  key={localDateKey(d.date)}
                  onClick={() => setDay(localDateKey(d.date))}
                  data-trained={d.sessions > 0}
                >
                  <span>
                    {d.date.toLocaleDateString(locale, { weekday: "short" })}
                  </span>
                  <strong>{d.date.getDate()}</strong>
                  <small>
                    {d.sessions
                      ? `${d.sessions} ${t("sesiones", "sessions")}`
                      : "—"}
                  </small>
                </button>
              ))}
            </div>
          )}
          {!totals.sessions && (
            <p className="progress-empty">
              {t(
                "Todavía no hay entrenamientos en este período. Tu progreso va a aparecer después de guardar una sesión.",
                "No workouts in this period yet. Your progress will appear after you save a session.",
              )}
            </p>
          )}
          <section className="panel">
            <div className="progress-section-heading">
              <div>
                <h2>{t("Avances recientes", "Recent improvements")}</h2>
                <p>
                  {t(
                    "Últimas cuatro semanas, dentro del período elegido.",
                    "Last four weeks, within the selected period.",
                  )}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setTab("exercises")}>
                {t("Ver ejercicios", "View exercises")}
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </div>
            {advances.length ? (
              <div className="progress-improvements">
                {advances.slice(0, 3).map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => {
                      setSelected(a.id);
                      setTab("exercises");
                    }}
                  >
                    <span>
                      {catalog.find((e) => e.id === a.id)?.name ?? a.id}
                    </span>
                    <strong>
                      {formatSet(
                        a.result.before.kg,
                        a.result.before.value,
                        a.result.before.metric,
                      )}{" "}
                      →{" "}
                      {formatSet(
                        a.result.after.kg,
                        a.result.after.value,
                        a.result.after.metric,
                      )}
                    </strong>
                    <small>{a.date.toLocaleDateString(locale)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="progress-empty">
                {t(
                  "Las mejoras aparecerán cuando tengas sesiones comparables. Tu primera marca es el punto de partida.",
                  "Improvements will appear when you have comparable sessions. Your first performance is your starting point.",
                )}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="progress-section-heading">
              <div>
                <h2>
                  {t("Series por zona muscular", "Sets per muscle group")}
                </h2>
                <p>
                  {t(
                    "Cómo distribuiste el trabajo en este período.",
                    "How you distributed your training in this period.",
                  )}
                </p>
              </div>
            </div>
            <div
              className="progress-muscle-bars"
              role="img"
              aria-label={`${t("Series por zona muscular", "Sets per muscle group")}: ${muscles.map(([g, n]) => `${t(g, g)} ${n}`).join(", ")}`}
            >
              {muscles.map(([g, n]) => (
                <div key={g}>
                  <span>{t(g, g)}</span>
                  <div className="progress-muscle-track">
                    <i style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <details className="progress-detail">
              <summary>{t("Ver detalle", "View details")}</summary>
              <p>
                {t(
                  "Cada ejercicio cuenta para su zona principal. No mide intensidad, recuperación ni entrenamiento de músculos secundarios.",
                  "Each exercise counts towards its main muscle group. This does not measure intensity, recovery or secondary muscle training.",
                )}
              </p>
              <p>
                {t("Días entrenados", "Training days")}: {totals.days} ·{" "}
                {t("Volumen", "Volume")}:{" "}
                {Math.round(totals.volumeKg * factor).toLocaleString(locale)}{" "}
                {unit}
              </p>
              {totals.unknown > 0 && (
                <p>
                  {totals.unknown}{" "}
                  {t(
                    "sesiones sin duración registrada",
                    "sessions without recorded duration",
                  )}
                </p>
              )}
            </details>
          </section>
        </>
      )}
      {tab === "exercises" && (
        <section className="panel">
          <div className="progress-section-heading">
            <div>
              <h2>{t("Evolución por ejercicio", "Exercise progression")}</h2>
              <p>
                {t(
                  "Tus marcas, evolución e historial en un solo lugar.",
                  "Your bests, progression and history in one place.",
                )}
              </p>
            </div>
          </div>
          <label>
            {t("Elegí un ejercicio", "Choose an exercise")}
            <select
              value={selectedId}
              onChange={(e) => setSelected(e.target.value)}
            >
              {!recordedCatalog.length && (
                <option value="">
                  {t("Sin ejercicios registrados", "No exercises recorded")}
                </option>
              )}
              {recordedCatalog.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <div className="progress-exercise-controls">
            <label>
              {t("Métrica", "Metric")}
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="weight">
                  {t("Carga máxima", "Maximum load")} ({unit})
                </option>
                <option value="reps">{t("Repeticiones", "Repetitions")}</option>
                <option value="volume">
                  {t("Volumen", "Volume")} ({unit})
                </option>
                <option value="seconds">{t("Tiempo", "Time")} (s)</option>
              </select>
            </label>
            <label className="progress-warmups">
              <input
                type="checkbox"
                checked={warmups}
                onChange={(e) => setWarmups(e.target.checked)}
              />
              {t("Incluir calentamientos", "Include warm-ups")}
            </label>
          </div>
          <ProgressChart
            key={`${selectedId}-${metric}-${period}-${localDateKey(anchor)}`}
            points={points}
            label={metricLabel}
            unit={
              metric === "weight" || metric === "volume"
                ? unit
                : metric === "seconds"
                  ? "s"
                  : ""
            }
          />
          <h3 className="progress-subheading">
            {t("Récords personales", "Personal records")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Mejores marcas históricas logradas en el período elegido. No incluye calentamientos.",
              "All-time best performances achieved in the selected period. Warm-ups excluded.",
            )}
          </p>
          <div className="progress-records">
            {bestRecords.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDay(localDateKey(r.date))}
              >
                <Trophy aria-hidden="true" />
                <span>
                  {r.kind === "weight"
                    ? t("Mayor peso", "Highest weight")
                    : r.metric === "seconds"
                      ? t("Mayor tiempo", "Longest hold")
                      : t("Más repeticiones", "Most repetitions")}
                </span>
                <strong>{formatSet(r.weight, r.quantity, r.metric)}</strong>
                <small>{new Date(r.date).toLocaleDateString(locale)}</small>
              </button>
            ))}
          </div>
          {!bestRecords.length && (
            <p className="progress-empty">
              {t(
                "No hay mejores marcas históricas en este período.",
                "No all-time best performances in this period.",
              )}
            </p>
          )}
          <h3 className="progress-subheading">
            {t("Historial de entrenamientos", "Workout history")}
          </h3>
          {[...history].reverse().map((r, i) => (
            <button
              className="progress-history-row"
              type="button"
              key={i}
              onClick={() => setDay(localDateKey(r.date))}
            >
              <strong>{r.date.toLocaleDateString(locale)}</strong>
              <span>
                {r.sets
                  .map((s) => formatSet(s.kg, s.value, s.metric))
                  .join(" · ")}
              </span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          ))}
          {selectedExercise && !history.length && (
            <p className="progress-empty">
              {t(
                "No hay registros de este ejercicio en el período elegido.",
                "No entries for this exercise in the selected period.",
              )}
            </p>
          )}
        </section>
      )}
      {tab === "exercises" && snapshot.sessions.length > 0 && (
        <Button
          variant="secondary"
          onClick={() => {
            const latest = [...snapshot.sessions].sort(
              (a, b) => Date.parse(b.date) - Date.parse(a.date),
            )[0]!;
            void shareWorkoutPoster(snapshot, latest).catch(() =>
              notify(
                t(
                  "No se pudo compartir el entrenamiento.",
                  "Could not share workout.",
                ),
              ),
            );
          }}
        >
          {t("Compartir último entrenamiento", "Share latest workout")}
        </Button>
      )}
      {tab === "body" && <BodyProgress range={range} period={period} />}
    </div>
  );
}
