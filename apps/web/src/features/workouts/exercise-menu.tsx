"use client";
import { Menu } from "@base-ui/react/menu";
import {
  Check,
  Info,
  Layers,
  Repeat,
  Scale,
  Settings,
  Timer,
  Trash2,
  Unlink,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import {
  metricFor,
  switchEntryMetric,
  type Entry,
} from "@fitty/core/domain/workouts";
import { changeWeightUnit } from "@fitty/core/domain/workout-entry-actions";

/** Gear button on every exercise of the workout in progress, opening a floating menu. */
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
    metric = metricFor(snapshot, entry.id, entry),
    unit = snapshot.settings.weight ?? "kg";
  return (
    <Menu.Root>
      <Menu.Trigger
        className="exercise-menu-trigger"
        aria-label={t("Ajustes del ejercicio", "Exercise settings")}
        onClick={(event) => event.preventDefault()}
      >
        <Settings aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="exercise-menu-positioner"
        >
          <Menu.Popup className="exercise-menu-popup">
            <Menu.Item className="exercise-menu-item" onClick={onReplace}>
              <Repeat aria-hidden="true" />
              {t("Reemplazar ejercicio", "Replace exercise")}
            </Menu.Item>
            <Menu.Item className="exercise-menu-item" onClick={onDetails}>
              <Info aria-hidden="true" />
              {t("Ver detalles del ejercicio", "View exercise details")}
            </Menu.Item>
            <Menu.Separator className="exercise-menu-separator" />
            <Menu.Group>
              <Menu.GroupLabel className="exercise-menu-label">
                <Timer aria-hidden="true" />
                {t("Medir por", "Track by")}
              </Menu.GroupLabel>
              <Menu.RadioGroup
                value={metric}
                onValueChange={(value) => {
                  const next = value === "seconds" ? "seconds" : "reps";
                  if (next === metric) return;
                  onChange((draft) => switchEntryMetric(draft, metric, next));
                  change((draft) => {
                    draft.settings.exerciseMetrics = {
                      ...draft.settings.exerciseMetrics,
                      [entry.id]: next,
                    };
                  });
                }}
              >
                {(
                  [
                    ["reps", t("Repeticiones", "Repetitions")],
                    ["seconds", t("Tiempo", "Time")],
                  ] as const
                ).map(([value, label]) => (
                  <Menu.RadioItem
                    key={value}
                    value={value}
                    className="exercise-menu-item exercise-menu-radio"
                  >
                    <Menu.RadioItemIndicator className="exercise-menu-check">
                      <Check aria-hidden="true" />
                    </Menu.RadioItemIndicator>
                    {label}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.Separator className="exercise-menu-separator" />
            <Menu.Group>
              <Menu.GroupLabel className="exercise-menu-label">
                <Scale aria-hidden="true" />
                {t("Unidad de peso", "Weight unit")}
              </Menu.GroupLabel>
              <Menu.RadioGroup
                value={unit}
                onValueChange={(value) => {
                  const next = value === "lb" ? "lb" : "kg";
                  change((draft) => changeWeightUnit(draft, next));
                }}
              >
                {(["kg", "lb"] as const).map((value) => (
                  <Menu.RadioItem
                    key={value}
                    value={value}
                    className="exercise-menu-item exercise-menu-radio"
                  >
                    <Menu.RadioItemIndicator className="exercise-menu-check">
                      <Check aria-hidden="true" />
                    </Menu.RadioItemIndicator>
                    {value}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
              <p className="exercise-menu-hint">
                {t(
                  "Se aplica a toda la cuenta",
                  "Applies to the whole account",
                )}
              </p>
            </Menu.Group>
            <Menu.Separator className="exercise-menu-separator" />
            <Menu.Item className="exercise-menu-item" onClick={onSuperset}>
              <Layers aria-hidden="true" />
              {t("Crear superserie", "Create superset")}
            </Menu.Item>
            {entry.superset && (
              <Menu.Item
                className="exercise-menu-item"
                onClick={onLeaveSuperset}
              >
                <Unlink aria-hidden="true" />
                {t("Quitar de la superserie", "Remove from superset")}
              </Menu.Item>
            )}
            <Menu.Separator className="exercise-menu-separator" />
            <Menu.Item
              className="exercise-menu-item exercise-menu-danger"
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
              {t("Quitar del entrenamiento", "Remove from workout")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
