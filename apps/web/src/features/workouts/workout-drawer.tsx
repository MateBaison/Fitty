"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, X } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useElapsedTime } from "@/lib/browser/use-elapsed-time";
import { useApp } from "@/state/app-provider";

/**
 * The workout in progress on the home page: a panel above the bottom bar with
 * the time since it started, and the ways to cancel or continue it.
 */
export function WorkoutDrawer() {
  const { snapshot, change, t } = useApp();
  const [ask, confirmDialog] = useConfirm();
  const started = snapshot.workout?.started;
  const open = usePathname() === "/home" && started !== undefined;
  // Kept while it slides back down.
  const [last, setLast] = useState(started);
  if (started !== undefined && started !== last) setLast(started);
  const elapsed = useElapsedTime(started ?? last ?? NaN);
  const cancel = async () => {
    if (
      await ask(t("¿Cancelar este entrenamiento?", "Cancel this workout?"), {
        confirmLabel: t("Cancelar entrenamiento", "Cancel workout"),
        destructive: true,
      })
    )
      change((draft) => {
        draft.workout = null;
      });
  };
  return (
    <>
      <div className="bar-drawer workout-drawer" data-open={open} inert={!open}>
        <div className="bar-drawer-panel">
          <div className="workout-drawer-details">
            <p>
              <i className="workout-dot" aria-hidden="true" />
              <span>{t("Entrenamiento en curso", "Workout in progress")}</span>
            </p>
            <strong
              role="timer"
              aria-label={t("Tiempo transcurrido", "Elapsed time")}
            >
              {elapsed}
            </strong>
          </div>
          <button
            type="button"
            className="workout-drawer-cancel"
            aria-label={t("Cancelar entrenamiento", "Cancel workout")}
            title={t("Cancelar entrenamiento", "Cancel workout")}
            onClick={cancel}
          >
            <X aria-hidden="true" />
          </button>
          <Link
            href="/workout"
            className="workout-drawer-continue"
            aria-label={t("Continuar", "Continue")}
            title={t("Continuar", "Continue")}
          >
            <Play aria-hidden="true" fill="currentColor" />
          </Link>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
