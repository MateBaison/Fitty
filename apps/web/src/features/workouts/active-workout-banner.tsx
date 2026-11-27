"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Timer, X } from "lucide-react";
import { timeFormat } from "@fitty/core/domain/combat";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useApp } from "@/state/app-provider";

/**
 * The workout in progress on the home page: it stays under the header while the
 * page scrolls, and counts the time since the workout started.
 */
export function ActiveWorkoutBanner({
  day,
  routine,
  started,
}: {
  day: string;
  routine?: string;
  started: number;
}) {
  const { change, t } = useApp();
  const [ask, confirmDialog] = useConfirm();
  const banner = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  // The header is sticky too and its height depends on the screen width.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".app-header");
    if (!header) return;
    const observer = new ResizeObserver(() => {
      if (banner.current) banner.current.style.top = `${header.offsetHeight}px`;
    });
    observer.observe(header, { box: "border-box" });
    return () => observer.disconnect();
  }, []);
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
    <div ref={banner} className="active-workout-sticky">
      <section className="active-workout hero-panel">
        <div className="active-workout-details">
          <span className="eyebrow">
            ● {t("Entrenamiento en curso", "Workout in progress")}
          </span>
          <h2 className="my-2 text-2xl font-bold">{day}</h2>
          <p>{routine}</p>
        </div>
        <div className="active-workout-actions">
          <span
            className="active-workout-time"
            role="timer"
            aria-label={t("Tiempo transcurrido", "Elapsed time")}
          >
            <Timer aria-hidden="true" />
            {now !== null && Number.isFinite(started)
              ? timeFormat((now - started) / 1000)
              : "--:--"}
          </span>
          <div className="active-workout-buttons">
            <Button
              variant="destructive-solid"
              className="active-workout-button"
              aria-label={t("Cancelar entrenamiento", "Cancel workout")}
              title={t("Cancelar entrenamiento", "Cancel workout")}
              onClick={cancel}
            >
              <X aria-hidden="true" />
            </Button>
            <Link
              href="/workout"
              className="primary-link active-workout-button"
              aria-label={t("Continuar", "Continue")}
              title={t("Continuar", "Continue")}
            >
              <Play aria-hidden="true" fill="currentColor" />
            </Link>
          </div>
        </div>
      </section>
      {confirmDialog}
    </div>
  );
}
