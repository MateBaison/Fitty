"use client";
import { useSwipeNavigation } from "@/lib/browser/use-swipe-navigation";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Trophy,
  Activity,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPanel } from "@/features/calendar/calendar-panel";
import { catalogFor, localDateKey, validDateKey } from "@/domain/workouts";
import { exerciseHistories, recentImprovements } from "@/domain/progress";
import { recordPanel } from "@/domain/personal-records";
import {
  progressRange,
  shiftProgressDate,
  periodSessions,
  progressTotals,
  muscleTotals,
  newRecordCount,
  type ProgressPeriod,
} from "@/domain/progress-period";
import { ProgressChart, type ChartPoint } from "./progress-chart";
import { shareWorkoutPoster } from "@/features/sharing/workout-poster";
import { ProgressComparison } from "./progress-comparison";
import { BodyProgress } from "./body-progress";
const periods = [
  ["day", "Día", "Day"],
  ["week", "Semana", "Week"],
  ["month", "Mes", "Month"],
  ["quarter", "3 meses", "3 months"],
  ["year", "Año", "Year"],
  ["all", "Siempre", "Lifetime"],
] as const;
export function ProgressScreen() {
  const { snapshot, t, notify } = useApp();
  const [tab, setTab] = useState<"summary" | "exercises" | "body">("summary"),
    [period, setPeriod] = useState<ProgressPeriod>("week"),
    [anchor, setAnchor] = useState(() => new Date()),
    [customStart, setCustomStart] = useState(false),
    [advancePeriod, setAdvancePeriod] = useState<"week" | "month" | "quarter">(
      "month",
    ),
    [selected, setSelected] = useState(""),
    [metric, setMetric] = useState("weight"),
    [warmups, setWarmups] = useState(false),
    [day, setDay] = useState<string | null>(null),
    [comparing, setComparing] = useState(false);
  const swipe = useSwipeNavigation((direction) => {
    const tabs = ["summary", "exercises", "body"] as const;
    const next = tabs[tabs.indexOf(tab) + (direction === "next" ? 1 : -1)];
    if (!next) return false;
    setTab(next);
    return true;
  });
  const unit = snapshot.settings.weight ?? "kg",
    factor = unit === "lb" ? 2.20462 : 1,
    locale = snapshot.settings.language ?? "es";
  const range = progressRange(period, anchor, customStart),
    chosenSessions = periodSessions(snapshot, range),
    scoped = { ...snapshot, sessions: chosenSessions },
    totals = progressTotals(scoped);
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
  const advanceCutoff = shiftProgressDate(new Date(), advancePeriod, -1);
  const advances = recentImprovements(snapshot, new Date(), advanceCutoff);
  const newRecords = useMemo(
    () => newRecordCount(snapshot, chosenSessions),
    [snapshot, period, anchor, customStart],
  );
  const counts = muscleTotals(scoped),
    muscles = Object.entries(counts).sort((a, b) => b[1] - a[1]),
    max = Math.max(1, ...Object.values(counts));
  const move = (direction: number) => {
    setAnchor(shiftProgressDate(range.start, period, direction));
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
  return (
    <div className="progress-dashboard swipe-navigation" {...swipe}>
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
      {tab === "summary" && (
        <details className="panel progress-advances" open>
          <summary className="progress-section-heading">
            <h2>{t("Avances recientes", "Recent improvements")}</h2>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="progress-advance-controls">
            <label>
              {t("Período de avances", "Improvement period")}
              <select
                value={advancePeriod}
                onChange={(e) =>
                  setAdvancePeriod(e.target.value as typeof advancePeriod)
                }
              >
                <option value="week">{t("1 semana", "1 week")}</option>
                <option value="month">{t("1 mes", "1 month")}</option>
                <option value="quarter">{t("3 meses", "3 months")}</option>
              </select>
            </label>
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
        </details>
      )}
      <section
        className="progress-period"
        aria-label={t("Período de progreso", "Progress period")}
      >
        <label className="progress-period-select">
          {t("Período", "Period")}
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as ProgressPeriod);
              setAnchor(new Date());
              setCustomStart(false);
            }}
          >
            {periods.map(([id, es, en]) => (
              <option key={id} value={id}>
                {t(es, en)}
              </option>
            ))}
          </select>
        </label>
        {
          <div className="progress-period-navigation">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("Período anterior", "Previous period")}
              disabled={period === "all"}
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
              value={
                period === "all" && !customStart
                  ? ""
                  : localDateKey(range.start)
              }
              onChange={(e) => {
                if (validDateKey(e.target.value)) {
                  setAnchor(new Date(`${e.target.value}T12:00:00`));
                  setCustomStart(true);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("Período siguiente", "Next period")}
              disabled={period === "all"}
              onClick={() => move(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAnchor(new Date());
                setCustomStart(false);
              }}
            >
              {t("Hoy", "Today")}
            </Button>
          </div>
        }
      </section>
      {tab === "summary" && (
        <>
          <section aria-label={t("Resumen", "Summary")}>
            <div className="progress-stats">
              {[
                {
                  label: t("Entrenamientos", "Workouts"),
                  value: String(totals.sessions),
                  icon: CalendarDays,
                },
                {
                  label: t("Tiempo registrado", "Recorded time"),
                  value:
                    totals.sessions > 0 && totals.unknown === totals.sessions
                      ? "—"
                      : duration(totals.minutes),
                  icon: Clock,
                },
                {
                  label: t("Días entrenados", "Training days"),
                  value: String(totals.days),
                  icon: CalendarDays,
                },
              ].map((card) => (
                <article className="progress-stat" key={card.label}>
                  <card.icon aria-hidden="true" />
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          </section>
          {!totals.sessions && (
            <p className="progress-empty">
              {t(
                "Todavía no hay entrenamientos en este período. Tu progreso va a aparecer después de guardar una sesión.",
                "No workouts in this period yet. Your progress will appear after you save a session.",
              )}
            </p>
          )}
          <div className="progress-comparison-toggle">
            <p>
              {t(
                "Este período: cuánto entrenaste. Ejercicios: cómo cambiaron tus marcas. Cuerpo: tus medidas y fotos.",
                "This period: how much you trained. Exercises: how your performances changed. Body: your measurements and photos.",
              )}
            </p>
            <Button
              variant="secondary"
              aria-expanded={comparing}
              onClick={() => setComparing((value) => !value)}
            >
              {comparing
                ? t("Cerrar comparación", "Close comparison")
                : t("Comparar períodos", "Compare periods")}
            </Button>
          </div>
          {comparing && (
            <ProgressComparison
              key={`${period}-${localDateKey(range.start)}-${customStart}`}
              range={range}
              period={period}
            />
          )}
          <details className="panel progress-training-details">
            <summary>
              {t("Ver detalle del entrenamiento", "View training details")}
            </summary>
            <p>
              {t("Series", "Sets")}: {totals.sets} ·{" "}
              {t("Nuevos récords", "New records")}: {newRecords}
            </p>
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
          </details>
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
