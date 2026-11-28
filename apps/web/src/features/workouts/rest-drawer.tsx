"use client";
import { useEffect } from "react";
import { SkipForward, Timer } from "lucide-react";
import { timeFormat } from "@fitty/core/domain/combat";
import { useApp } from "@/state/app-provider";
import { useRuntime } from "@/state/runtime-provider";

/**
 * The rest countdown: it slides up from behind the bottom bar while a rest
 * between sets is running.
 */
export function RestDrawer() {
  const { snapshot, t } = useApp();
  const { rest, now, setRest } = useRuntime();
  const working = Boolean(snapshot.workout);
  const open = working && rest.end > now;
  // A rest ends with its workout, so it never announces itself later.
  useEffect(() => {
    if (!working && rest.end) setRest({ end: 0, duration: 0 });
  }, [working, rest.end, setRest]);
  return (
    <div className="bar-drawer rest-drawer" data-open={open} inert={!open}>
      <div className="bar-drawer-panel">
        <Timer aria-hidden="true" />
        <span>{t("Descanso", "Rest")}</span>
        <strong role="timer">
          {timeFormat(Math.ceil(Math.max(0, rest.end - now) / 1000))}
        </strong>
        <button
          type="button"
          aria-label={t("Omitir descanso", "Skip rest")}
          title={t("Omitir descanso", "Skip rest")}
          onClick={() => setRest({ end: 0, duration: 0 })}
        >
          <SkipForward aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
