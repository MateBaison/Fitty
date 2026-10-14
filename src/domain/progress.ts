import type { Snapshot } from "./schemas/snapshot";
import { catalogFor, countSetGroups } from "./workouts";
export const groups = [
  "Pectorales",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Abdominales",
  "Piernas",
  "Gemelos",
] as const;
export type RecordSet = {
  type?: string;
  kg: number;
  value: number;
  metric: "reps" | "seconds";
};
export type History = { date: Date; sets: RecordSet[] };
export function exerciseHistories(snapshot: Snapshot, includeWarmups = true) {
  const histories = new Map<string, History[]>();
  for (const session of [...snapshot.sessions].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  )) {
    const date = new Date(session.date);
    if (!Number.isFinite(date.getTime())) continue;
    for (const exercise of session.exercises ?? []) {
      const sets = (exercise.performedSets ?? []).flatMap(
        (set): RecordSet[] => {
          if (!includeWarmups && set.type === "warmup") return [];
          const metric = Number(set.seconds) > 0 ? "seconds" : "reps",
            value = Number(set[metric]);
          return value > 0
            ? [
                {
                  ...(set.type ? { type: set.type } : {}),
                  metric,
                  value,
                  kg:
                    Number(set.kg ?? 0) /
                    (session.weightUnit === "lb" ? 2.20462 : 1),
                },
              ]
            : [];
        },
      );
      if (sets.length)
        histories.set(exercise.id, [
          ...(histories.get(exercise.id) ?? []),
          { date, sets },
        ]);
    }
  }
  return histories;
}
export function improvement(current: History, previous?: History) {
  if (!previous) return null;
  const matches = current.sets.flatMap((after) =>
    previous.sets.flatMap((before) => {
      if (after.metric !== before.metric) return [];
      if (after.value === before.value && after.kg > before.kg + 0.05)
        return [{ kind: "weight", before, after, gain: after.kg - before.kg }];
      if (Math.abs(after.kg - before.kg) < 0.15 && after.value > before.value)
        return [
          { kind: "quantity", before, after, gain: after.value - before.value },
        ];
      return [];
    }),
  );
  return (
    matches.sort(
      (a, b) =>
        Number(b.kind === "weight") - Number(a.kind === "weight") ||
        b.gain - a.gain,
    )[0] ?? null
  );
}
export function comparable(current: History, previous?: History) {
  return (
    !!previous &&
    current.sets.some((set) =>
      previous.sets.some(
        (old) =>
          set.metric === old.metric &&
          (set.value === old.value || Math.abs(set.kg - old.kg) < 0.15),
      ),
    )
  );
}
export function weeklyData(
  snapshot: Snapshot,
  count: number,
  now = new Date(),
) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const catalog = catalogFor(snapshot, true);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (count - 1 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const sessions = snapshot.sessions.filter(
        (session) =>
          new Date(session.date) >= start && new Date(session.date) < end,
      ),
      counts: Record<string, number> = Object.fromEntries(
        groups.map((group) => [group, 0]),
      );
    for (const session of sessions) {
      const totals = session.groupSets;
      if (totals && typeof totals === "object" && !Array.isArray(totals)) {
        for (const group of groups)
          counts[group] =
            (counts[group] ?? 0) +
            Math.max(
              0,
              Number((totals as Record<string, unknown>)[group]) || 0,
            );
      } else
        for (const exercise of session.exercises ?? []) {
          const group =
            exercise.group ||
            catalog.find((item) => item.id === exercise.id)?.group;
          if (group && group in counts)
            counts[group] =
              (counts[group] ?? 0) +
              (exercise.performedSets
                ? countSetGroups(exercise.performedSets)
                : (exercise.sets ?? 0));
        }
    }
    return { start, sessions: sessions.length, groups: counts };
  });
}

// Historical duration is stored in minutes. Unknown durations stay unknown.
export function weeklySummary(snapshot: Snapshot, now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const sessions = snapshot.sessions.filter((session) => {
      const instant = new Date(session.date);
      return instant >= date && instant < end;
    });
    const unknown = sessions.filter(
      (session) => session.duration == null,
    ).length;
    return {
      date,
      sessions: sessions.length,
      minutes: sessions.reduce(
        (sum, session) => sum + (session.duration ?? 0),
        0,
      ),
      unknown,
      volumeKg: sessions.reduce(
        (sum, session) => sum + sessionVolumeKg(session),
        0,
      ),
      sets: sessions.reduce((sum, session) => sum + (session.sets ?? 0), 0),
    };
  });
  return {
    start: monday,
    days,
    sessions: days.reduce((sum, day) => sum + day.sessions, 0),
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
    unknown: days.reduce((sum, day) => sum + day.unknown, 0),
    trainedDays: days.filter((day) => day.sessions > 0).length,
    volumeKg: days.reduce((sum, day) => sum + day.volumeKg, 0),
  };
}

/** Most recent improvement for each exercise in the last 28 local calendar days. */
export function recentImprovements(snapshot: Snapshot, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 28);
  const history = exerciseHistories(snapshot, false);
  return [...history]
    .flatMap(([id, records]) => {
      for (let index = records.length - 1; index > 0; index--) {
        const current = records[index]!;
        if (current.date < cutoff || current.date > now) continue;
        const previous = records[index - 1]!;
        const candidates = current.sets.flatMap((after) => {
          const comparable = previous.sets.filter(
            (before) => before.metric === after.metric,
          );
          const heaviest = [...comparable].sort(
            (a, b) => b.kg - a.kg || b.value - a.value,
          )[0];
          if (!heaviest) return [];
          if (after.kg > heaviest.kg + 0.05)
            return [
              {
                kind: "weight",
                before: heaviest,
                after,
                gain: after.kg - heaviest.kg,
              },
            ];
          const sameLoad = comparable
            .filter((before) => Math.abs(after.kg - before.kg) <= 0.05)
            .sort((a, b) => b.value - a.value)[0];
          if (sameLoad && after.value > sameLoad.value)
            return [
              {
                kind: "quantity",
                before: sameLoad,
                after,
                gain: after.value - sameLoad.value,
              },
            ];
          return [];
        });
        const result = candidates.sort(
          (a, b) =>
            Number(b.kind === "weight") - Number(a.kind === "weight") ||
            b.gain - a.gain,
        )[0];
        if (result) return [{ id, date: current.date, result }];
      }
      return [];
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function sessionVolumeKg(session: Snapshot["sessions"][number]) {
  return (
    session.volumeKg ??
    (session.volume ?? 0) / (session.weightUnit === "lb" ? 2.20462 : 1)
  );
}
export function lifetimeSummary(snapshot: Snapshot) {
  const sessions = snapshot.sessions.filter((session) =>
    Number.isFinite(Date.parse(session.date)),
  );
  return {
    sessions: sessions.length,
    minutes: sessions.reduce(
      (sum, session) => sum + (session.duration ?? 0),
      0,
    ),
    unknown: sessions.filter((session) => session.duration == null).length,
    trainedDays: new Set(
      sessions.map((session) => {
        const d = new Date(session.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    ).size,
    volumeKg: sessions.reduce(
      (sum, session) => sum + sessionVolumeKg(session),
      0,
    ),
  };
}
