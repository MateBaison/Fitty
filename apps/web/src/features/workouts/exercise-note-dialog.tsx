"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { EXERCISE_NOTE_MAX } from "@fitty/core/domain/exercise-notes";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useApp } from "@/state/app-provider";

/** Floating window to read or edit the standing note of an exercise. */
export function ExerciseNoteDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const { t } = useApp(),
    [note, setNote] = useState(initial),
    [ask, confirmDialog] = useConfirm();
  const remove = async () => {
    if (
      await ask(t("¿Eliminar la nota?", "Delete the note?"), {
        confirmLabel: t("Eliminar", "Delete"),
        destructive: true,
      })
    ) {
      onSave("");
      onClose();
    }
  };
  return (
    <AppDialog
      open
      onClose={onClose}
      title={t("Notas de ejercicio", "Exercise notes")}
      centered
      backLabel={t("Volver", "Back")}
    >
      <div className="exercise-menu-body">
        {initial && (
          <button
            type="button"
            className="dialog-delete-button"
            aria-label={t("Eliminar nota", "Delete note")}
            title={t("Eliminar nota", "Delete note")}
            onClick={remove}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
        <label className="block">
          {t(
            "Instrucciones o comentarios sobre este ejercicio",
            "Instructions or comments about this exercise",
          )}
          <textarea
            rows={5}
            maxLength={EXERCISE_NOTE_MAX}
            autoFocus={!initial}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className="exercise-menu-hint">
          {t(
            "Aparece cada vez que hacés este ejercicio.",
            "It shows every time you do this exercise.",
          )}
        </p>
        <Button
          onClick={() => {
            onSave(note);
            onClose();
          }}
        >
          {t("Guardar", "Save")}
        </Button>
        {confirmDialog}
      </div>
    </AppDialog>
  );
}
