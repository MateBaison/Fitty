"use client";
import { useState } from "react";
import { Ellipsis, Layers, Repeat, Trash2 } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/app-provider";

/** Three dots on every exercise of a routine day, opening a floating menu. */
export function ExerciseOptions({
  name,
  canSuperset,
  onReplace,
  onSuperset,
  onRemove,
}: {
  name: string;
  /** A superset needs a second exercise in the day. */
  canSuperset: boolean;
  onReplace: () => void;
  onSuperset: () => void;
  onRemove: () => void;
}) {
  const { t } = useApp(),
    [open, setOpen] = useState(false);
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <>
      <Button
        variant="secondary"
        className="exercise-more"
        aria-label={`${t("Más opciones", "More options")} ${name}`}
        aria-haspopup="dialog"
        title={t("Más opciones", "More options")}
        onClick={() => setOpen(true)}
      >
        <Ellipsis aria-hidden="true" />
      </Button>
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("Más opciones", "More options")}
        description={name}
        centered
        backLabel={t("Volver", "Back")}
      >
        <div className="exercise-menu-body">
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
            disabled={!canSuperset}
            onClick={run(onSuperset)}
          >
            <Layers aria-hidden="true" />
            {t("Agregar a superserie", "Add to superset")}
          </button>
          <button
            type="button"
            className="exercise-menu-item exercise-menu-danger"
            onClick={run(onRemove)}
          >
            <Trash2 aria-hidden="true" />
            {t("Eliminar ejercicio", "Delete exercise")}
          </button>
        </div>
      </AppDialog>
    </>
  );
}
