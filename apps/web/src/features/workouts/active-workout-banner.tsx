"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { timeFormat } from "@fitty/core/domain/combat";
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
  const { t } = useApp();
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
          <Link href="/workout" className="primary-link">
            {t("Continuar", "Continue")}
          </Link>
        </div>
      </section>
    </div>
  );
}
