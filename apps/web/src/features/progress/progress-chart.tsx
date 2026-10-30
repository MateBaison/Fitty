"use client";
import { useState } from "react";
import { useApp } from "@/state/app-provider";
export type ChartPoint = { date: Date; value: number; detail?: string };
export function ProgressChart({
  points,
  label,
  unit = "",
}: {
  points: ChartPoint[];
  label: string;
  unit?: string;
}) {
  const { t, snapshot } = useApp();
  const [active, setActive] = useState<number | null>(null);
  const locale = snapshot.settings.language ?? "es";
  if (!points.length)
    return (
      <p className="progress-empty">
        {t(
          "Todavía no hay datos para este gráfico.",
          "No data for this chart yet.",
        )}
      </p>
    );
  const values = points.map((p) => p.value),
    low = Math.min(...values),
    high = Math.max(...values),
    pad = Math.max((high - low) * 0.15, high * 0.05, 1);
  const minimum = Math.max(0, low - pad),
    maximum = high + pad;
  const first = points[0]!.date.getTime(),
    span = Math.max(1, points.at(-1)!.date.getTime() - first);
  const coordinates = points.map((p) => ({
    x: 45 + ((p.date.getTime() - first) / span) * 420,
    y: 180 - ((p.value - minimum) / (maximum - minimum)) * 145,
  }));
  const chosen =
    points[
      active !== null && active < points.length ? active : points.length - 1
    ]!;
  return (
    <div className="progress-chart">
      <div className="progress-chart-value">
        <strong>
          {chosen.value.toLocaleString(locale, { maximumFractionDigits: 1 })}{" "}
          {unit}
        </strong>
        <span>
          {chosen.date.toLocaleDateString(locale)}
          {chosen.detail ? ` · ${chosen.detail}` : ""}
        </span>
      </div>
      <svg
        viewBox="0 0 500 220"
        role="img"
        aria-label={`${label}: ${points.map((p) => `${p.date.toLocaleDateString(locale)} ${p.value} ${unit}`).join(", ")}`}
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="45"
              x2="465"
              y1={35 + f * 145}
              y2={35 + f * 145}
              stroke="var(--border)"
            />
            <text
              x="3"
              y={39 + f * 145}
              fill="var(--muted-foreground)"
              fontSize="11"
            >
              {(maximum - f * (maximum - minimum)).toLocaleString(locale, {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        <polyline
          points={coordinates.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
        />
        {coordinates.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={active === i ? 7 : 4}
            fill="var(--primary)"
          >
            <title>
              {points[i]!.date.toLocaleDateString(locale)}: {points[i]!.value}{" "}
              {unit}
            </title>
          </circle>
        ))}
        <text x="45" y="210" fill="var(--muted-foreground)" fontSize="11">
          {points[0]!.date.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          })}
        </text>
        <text
          x="465"
          textAnchor="end"
          y="210"
          fill="var(--muted-foreground)"
          fontSize="11"
        >
          {points.at(-1)!.date.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          })}
        </text>
      </svg>
      <div className="progress-point-picker">
        {points.map((p, i) => (
          <button
            type="button"
            key={i}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {p.date.toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
