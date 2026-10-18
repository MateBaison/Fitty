import { personalRecords } from "./personal-records";
import type { Snapshot } from "./schemas/snapshot";
import { countSetGroups, localDateKey } from "./workouts";
import { sessionVolumeKg, groups } from "./progress";
import { exercises } from "@/data/exercises";
export type ProgressPeriod =
  "day" | "week" | "month" | "quarter" | "year" | "all";
/** Shift a calendar date without overflowing the end of a shorter month. */
export function shiftProgressDate(
  date: Date,
  period: ProgressPeriod,
  direction: number,
) {
  const next = new Date(date);
  if (period === "day" || period === "week")
    next.setDate(next.getDate() + direction * (period === "day" ? 1 : 7));
  else if (period !== "all") {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(
      next.getMonth() +
        direction * (period === "quarter" ? 3 : period === "year" ? 12 : 1),
    );
    next.setDate(
      Math.min(
        day,
        new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
      ),
    );
  }
  return next;
}
export function progressRange(
  period: ProgressPeriod,
  anchor: Date,
  customStart = false,
) {
  const start = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate(),
  );
  if (period === "all") {
    const today = new Date();
    return {
      start: customStart ? start : new Date(0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    };
  }
  if (!customStart) {
    if (period === "week")
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    if (period === "month") start.setDate(1);
    if (period === "quarter")
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
    if (period === "year") start.setMonth(0, 1);
  }
  return { start, end: shiftProgressDate(start, period, 1) };
}
export function periodSessions(
  snapshot: Snapshot,
  range: { start: Date; end: Date },
) {
  return snapshot.sessions.filter((s) => {
    const time = Date.parse(s.date);
    return time >= range.start.getTime() && time < range.end.getTime();
  });
}
export function progressTotals(snapshot: Snapshot) {
  const sessions = snapshot.sessions.filter((s) =>
    Number.isFinite(Date.parse(s.date)),
  );
  return {
    sessions: sessions.length,
    days: new Set(sessions.map((s) => localDateKey(s.date))).size,
    minutes: sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0),
    unknown: sessions.filter((s) => s.duration == null).length,
    sets: sessions.reduce(
      (sum, s) =>
        sum +
        (s.sets ??
          s.exercises?.reduce(
            (n, e) =>
              n +
              (e.performedSets
                ? countSetGroups(e.performedSets)
                : (e.sets ?? 0)),
            0,
          ) ??
          0),
      0,
    ),
    volumeKg: sessions.reduce((sum, s) => sum + sessionVolumeKg(s), 0),
  };
}
export function muscleTotals(snapshot: Snapshot) {
  const counts: Record<string, number> = Object.fromEntries(
    groups.map((g) => [g, 0]),
  );
  for (const s of snapshot.sessions) {
    if (
      s.groupSets &&
      typeof s.groupSets === "object" &&
      !Array.isArray(s.groupSets)
    ) {
      for (const g of groups)
        counts[g] =
          (counts[g] ?? 0) +
          Math.max(0, Number((s.groupSets as Record<string, unknown>)[g]) || 0);
    } else
      for (const e of s.exercises ?? []) {
        const group =
          e.group ??
          exercises.find((x) => x.id === e.id)?.group ??
          snapshot.customExercises.find((x) => x.id === e.id)?.group;
        if (group && group in counts)
          counts[group] =
            (counts[group] ?? 0) +
            (e.performedSets ? countSetGroups(e.performedSets) : (e.sets ?? 0));
      }
  }
  return counts;
}

/** Count sets that improve a preceding performance; first entries and warm-ups are not records. */
export function newRecordCount(
  snapshot: Snapshot,
  sessions: Snapshot["sessions"],
) {
  const clean = {
    ...snapshot,
    sessions: snapshot.sessions.map((s) => ({
      ...s,
      exercises: s.exercises?.map((e) => ({
        ...e,
        performedSets: e.performedSets?.filter((set) => set.type !== "warmup"),
      })),
    })),
  };
  return sessions.reduce(
    (sum, s) =>
      sum +
      (s.exercises ?? []).reduce(
        (n, e) =>
          n +
          personalRecords(
            clean,
            e.id,
            (e.performedSets ?? []).filter((set) => set.type !== "warmup"),
            s.weightUnit ?? "kg",
            Date.parse(s.date),
            s.id,
          ).filter((records) => records.length > 0).length,
        0,
      ),
    0,
  );
}
