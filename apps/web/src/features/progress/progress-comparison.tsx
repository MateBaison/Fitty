"use client";
import { useState } from "react";
import { useApp } from "@/state/app-provider";
import { compareProgress, comparisonDates } from "@fitty/core/domain/progress-comparison";
import {
  progressRange,
  shiftProgressDate,
  type ProgressPeriod,
} from "@fitty/core/domain/progress-period";
import { RangeField } from "./range-field";
export function ProgressComparison({
  range,
  period,
}: {
  range: { start: Date; end: Date };
  period: ProgressPeriod;
}) {
  const { snapshot, t } = useApp();
  const initialRange =
    period === "all" ? progressRange("month", new Date()) : range;
  const [dates, setDates] = useState(() => ({
    a: comparisonDates(
      progressRange(
        period === "all" ? "month" : period,
        shiftProgressDate(
          initialRange.start,
          period === "all" ? "month" : period,
          -1,
        ),
        true,
      ),
    ),
    b: comparisonDates(initialRange),
  }));
  const totals = compareProgress(snapshot, dates.a, dates.b);
  const unit = snapshot.settings.weight ?? "kg",
    factor = unit === "lb" ? 2.20462 : 1;
  const [a, b] = totals ?? [];
  const number = (n: number) =>
    n.toLocaleString(snapshot.settings.language ?? "es", {
      maximumFractionDigits: 1,
    });
  const time = (value: NonNullable<typeof a>) =>
    value.sessions > 0 && value.unknown === value.sessions
      ? "—"
      : `${number(value.minutes)} min`;
  const rows =
    a && b
      ? [
          [
            t("Entrenamientos", "Workouts"),
            number(a.sessions),
            number(b.sessions),
          ],
          [
            t("Días entrenados", "Training days"),
            number(a.days),
            number(b.days),
          ],
          [t("Tiempo registrado", "Recorded time"), time(a), time(b)],
          [t("Series", "Sets"), number(a.sets), number(b.sets)],
          [
            t("Volumen", "Volume"),
            `${number(a.volumeKg * factor)} ${unit}`,
            `${number(b.volumeKg * factor)} ${unit}`,
          ],
        ]
      : [];
  return (
    <section
      className="panel progress-comparison"
      aria-label={t("Comparar períodos", "Compare periods")}
    >
      <h2>{t("Comparar períodos", "Compare periods")}</h2>
      <p>
        {t(
          "Elegí dos rangos de fechas. Las cifras muestran lo registrado en cada uno; más cantidad no siempre significa mejor progreso.",
          "Choose two date ranges. Figures show what was logged in each; a higher amount does not always mean better progress.",
        )}
      </p>
      <div className="comparison-date-grid">
        {(["a", "b"] as const).map((key) => (
          <fieldset key={key}>
            <legend>
              {key === "a"
                ? t("Período A", "Period A")
                : t("Período B", "Period B")}
            </legend>
            <RangeField
              label={t("Fechas", "Dates")}
              start={dates[key].start}
              end={dates[key].end}
              onChange={(range) =>
                setDates((current) => ({ ...current, [key]: range }))
              }
            />
          </fieldset>
        ))}
      </div>
      {!totals ? (
        <p role="alert">
          {t(
            "Elegí fechas válidas: el inicio debe ser anterior o igual al final.",
            "Choose valid dates: the start must be on or before the end.",
          )}
        </p>
      ) : (
        <div className="comparison-table-wrap">
          <table>
            <caption className="sr-only">
              {t("Comparar períodos", "Compare periods")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("Métrica", "Metric")}</th>
                <th scope="col">{t("Período A", "Period A")}</th>
                <th scope="col">{t("Período B", "Period B")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, first, second]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{first}</td>
                  <td>{second}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {a && b && a.unknown + b.unknown > 0 && (
        <p className="text-sm text-muted-foreground">
          {t(
            "El tiempo solo incluye sesiones con duración registrada.",
            "Time only includes sessions with a recorded duration.",
          )}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          "Volumen = peso × repeticiones de las series registradas. No equivale a fuerza y depende de los ejercicios elegidos.",
          "Volume = weight × repetitions of logged sets. It is not strength and depends on the exercises chosen.",
        )}
      </p>
    </section>
  );
}
