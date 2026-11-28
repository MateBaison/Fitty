"use client";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/app-provider";

export type ReorderRow = {
  key: string;
  /** One name, or every member of a superset. */
  names: string[];
  superset: boolean;
  /** The row that was long-pressed to open the window. */
  highlighted: boolean;
};

function Row({
  row,
  onStep,
}: {
  row: ReorderRow;
  /** Moves the row one place up (-1) or down (1). */
  onStep: (step: -1 | 1) => void;
}) {
  const { t } = useApp(),
    sort = useSortable({ id: row.key });
  return (
    <button
      type="button"
      ref={sort.setNodeRef}
      style={{
        transform: CSS.Translate.toString(sort.transform),
        transition: sort.transition,
      }}
      className="reorder-row"
      data-dragging={sort.isDragging || undefined}
      data-highlighted={row.highlighted || undefined}
      {...sort.listeners}
      aria-keyshortcuts="ArrowUp ArrowDown"
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        const element = event.currentTarget;
        onStep(event.key === "ArrowUp" ? -1 : 1);
        // Moving an element in the page can drop its focus.
        requestAnimationFrame(() => element.focus());
      }}
      aria-label={`${t("Mover ejercicio", "Move exercise")}: ${row.names.join(", ")}`}
    >
      <GripVertical aria-hidden="true" />
      <span>
        {row.superset && <small>{t("Superserie", "Superset")}</small>}
        {row.names.map((name, position) => (
          <strong key={position}>{name}</strong>
        ))}
      </span>
    </button>
  );
}

/** Compact list of the workout in progress, to drag exercises into another order. */
export function ReorderExercisesDialog({
  rows,
  onMove,
  onClose,
}: {
  rows: ReorderRow[];
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}) {
  const { t } = useApp();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );
  return (
    <AppDialog
      open
      onClose={onClose}
      title={t("Ordenar ejercicios", "Reorder exercises")}
      centered
      backLabel={t("Volver", "Back")}
    >
      <div className="exercise-menu-body">
        <p className="exercise-menu-hint">
          {t(
            "Mantené apretado y arrastrá para cambiar el orden. Solo cambia este entrenamiento.",
            "Press and hold, then drag to change the order. Only this workout changes.",
          )}
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            const from = rows.findIndex((row) => row.key === active.id),
              to = rows.findIndex((row) => row.key === over.id);
            if (from >= 0 && to >= 0) onMove(from, to);
          }}
        >
          <SortableContext
            items={rows.map((row) => row.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="reorder-list">
              {rows.map((row, index) => (
                <Row
                  key={row.key}
                  row={row}
                  onStep={(step) => {
                    const to = index + step;
                    if (to >= 0 && to < rows.length) onMove(index, to);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button onClick={onClose}>{t("Listo", "Done")}</Button>
      </div>
    </AppDialog>
  );
}
