"use client";
import { useState } from "react";
import { Switch } from "@base-ui/react/switch";
import { Info, Layers, Repeat, Settings, Trash2, Unlink } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { useApp } from "@/state/app-provider";
import {
  metricFor,
  switchEntryMetric,
  type Entry,
} from "@fitty/core/domain/workouts";
import { changeWeightUnit } from "@fitty/core/domain/workout-entry-actions";

function SwitchCard({
  title,
  off,
  on,
  value,
  onChange,
}: {
  title: string;
  off: string;
  on: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="exercise-menu-card">
      <span className="exercise-menu-card-title">{title}</span>
      <Switch.Root
        render={<button type="button" />}
        className="routine-switch"
        aria-label={title}
        checked={value}
        onCheckedChange={onChange}
      >
        <Switch.Thumb className="routine-switch-thumb" />
      </Switch.Root>
      <strong>{value ? on : off}</strong>
    </div>
  );
}

/** Gear button on every exercise of the workout in progress, opening a floating window. */
export function ExerciseMenu({
  entry,
  onChange,
  onReplace,
  onSuperset,
  onLeaveSuperset,
  onDetails,
  onRemove,
}: {
  entry: Entry;
  onChange: (edit: (draft: Entry) => void) => void;
  onReplace: () => void;
  onSuperset: () => void;
  onLeaveSuperset: () => void;
  onDetails: () => void;
  onRemove: () => void;
}) {
  const { snapshot, change, t } = useApp(),
    [open, setOpen] = useState(false),
    metric = metricFor(snapshot, entry.id, entry),
    unit = snapshot.settings.weight ?? "kg";
  // Actions that open another window close this one first.
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <>
      <button
        type="button"
        className="exercise-menu-trigger"
        aria-label={t("Ajustes del ejercicio", "Exercise settings")}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <Settings aria-hidden="true" />
      </button>
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("Ajustes del ejercicio", "Exercise settings")}
        centered
      >
        <div className="exercise-menu-body">
          <button
            type="button"
            className="exercise-menu-item"
            onClick={run(onSuperset)}
          >
            <Layers aria-hidden="true" />
            {t("Crear superserie", "Create superset")}
          </button>
          {entry.superset && (
            <button
              type="button"
              className="exercise-menu-item"
              onClick={run(onLeaveSuperset)}
            >
              <Unlink aria-hidden="true" />
              {t("Quitar de la superserie", "Remove from superset")}
            </button>
          )}
          <div className="exercise-menu-grid">
            <SwitchCard
              title={t("Medir por", "Track by")}
              off={t("Repeticiones", "Repetitions")}
              on={t("Tiempo", "Time")}
              value={metric === "seconds"}
              onChange={(checked) => {
                const next = checked ? "seconds" : "reps";
                if (next === metric) return;
                onChange((draft) => switchEntryMetric(draft, metric, next));
                change((draft) => {
                  draft.settings.exerciseMetrics = {
                    ...draft.settings.exerciseMetrics,
                    [entry.id]: next,
                  };
                });
              }}
            />
            <SwitchCard
              title={t("Unidad de peso", "Weight unit")}
              off="kg"
              on="lb"
              value={unit === "lb"}
              onChange={(checked) =>
                change((draft) => changeWeightUnit(draft, checked ? "lb" : "kg"))
              }
            />
          </div>
          <p className="exercise-menu-hint">
            {t("Unidad de peso", "Weight unit")}:{" "}
            {t("Se aplica a toda la cuenta", "Applies to the whole account")}
          </p>
          <button
            type="button"
            className="exercise-menu-item"
            onClick={run(onReplace)}
          >
            <Repeat aria-hidden="true" />
            {t("Reemplazar ejercicio", "Replace exercise")}
          </button>
          <button
            type="button"
            className="exercise-menu-item"
            onClick={run(onDetails)}
          >
            <Info aria-hidden="true" />
            {t("Ver detalles del ejercicio", "View exercise details")}
          </button>
          <button
            type="button"
            className="exercise-menu-item exercise-menu-danger"
            onClick={run(onRemove)}
          >
            <Trash2 aria-hidden="true" />
            {t("Quitar del entrenamiento", "Remove from workout")}
          </button>
        </div>
      </AppDialog>
    </>
  );
}
