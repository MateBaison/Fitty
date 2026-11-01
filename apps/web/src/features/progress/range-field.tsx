"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { localDateKey } from "@fitty/core/domain/workouts";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";

const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const key = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** One calendar for a date range: pick the first day, then the last, in a single dialog. */
export function RangeField({
  label,
  start,
  end,
  onChange,
}: {
  label: string;
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const { t, snapshot } = useApp();
  const locale = snapshot.settings.language ?? "es";
  const max = localDateKey(new Date());
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const anchor = valid(end) ? end : valid(start) ? start : max;
  const first = new Date(`${anchor}T12:00:00`);
  const [year, setYear] = useState(first.getFullYear());
  const [month, setMonth] = useState(first.getMonth());
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length }, (_, index) => index + 1),
  ];
  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };
  const short = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const shown =
    valid(start) && valid(end)
      ? start === end
        ? short(start)
        : `${short(start)} – ${short(end)}`
      : t("Elegir fechas", "Choose dates");
  const from = pending ?? start;
  const choose = (dateKey: string) => {
    if (!pending) {
      setPending(dateKey);
      return;
    }
    onChange(
      dateKey < pending
        ? { start: dateKey, end: pending }
        : { start: pending, end: dateKey },
    );
    setPending(null);
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        className="range-field"
        aria-label={`${label}: ${shown}`}
        onClick={() => {
          setPending(null);
          setOpen(true);
        }}
      >
        <small>{label}</small>
        <span>{shown}</span>
      </button>
      <AppDialog open={open} onClose={() => setOpen(false)} title={label}>
        <p className="text-sm text-muted-foreground">
          {pending
            ? t("Ahora elegí el último día", "Now choose the last day")
            : t("Elegí el primer día", "Choose the first day")}
        </p>
        <div className="range-calendar-head">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Mes anterior", "Previous month")}
            onClick={() => shift(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <strong>
            {new Date(year, month, 1).toLocaleDateString(locale, {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Mes siguiente", "Next month")}
            onClick={() => shift(1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div className="range-calendar" role="group" aria-label={label}>
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="range-weekday" aria-hidden="true">
              {new Date(2024, 0, 1 + index).toLocaleDateString(locale, {
                weekday: "narrow",
              })}
            </span>
          ))}
          {cells.map((day, index) => {
            if (!day) return <span key={`b${index}`} />;
            const dateKey = key(year, month, day);
            const edge =
              dateKey === from || (!pending && dateKey === end);
            const inside =
              !pending && valid(start) && valid(end) && dateKey > start && dateKey < end;
            return (
              <button
                type="button"
                key={dateKey}
                data-range-date={dateKey}
                aria-pressed={edge}
                data-inside={inside || undefined}
                disabled={dateKey > max}
                onClick={() => choose(dateKey)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </AppDialog>
    </>
  );
}
