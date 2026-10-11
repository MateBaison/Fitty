import type { Snapshot } from "./schemas/snapshot";

type Set = {
  kg?: number | null;
  reps?: number | null;
  seconds?: number | null;
  entered?: boolean;
  done?: boolean;
};
type Performance = {
  weight: number;
  quantity: number;
  metric: "reps" | "seconds";
};
export type PersonalRecord = "weight" | "reps" | "seconds";

function performance(
  set: Set,
  unit: "kg" | "lb",
  selectedMetric?: "reps" | "seconds",
): Performance | null {
  if (set.entered === false && !set.done) return null;
  const metric =
    selectedMetric ?? (Number(set.seconds) > 0 ? "seconds" : "reps");
  const quantity = Number(set[metric]);
  const weight = Number(set.kg ?? 0) / (unit === "lb" ? 2.20462 : 1);
  return Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(weight) &&
    weight >= 0
    ? { metric, quantity, weight }
    : null;
}

/** Compare only the same exercise and metric; ties and untouched defaults are not records. */
export function personalRecords(
  snapshot: Snapshot,
  exerciseId: string,
  sets: Set[],
  unit: "kg" | "lb",
  before: number,
  excludedSession?: string,
  selectedMetric?: "reps" | "seconds",
): PersonalRecord[][] {
  const history = snapshot.sessions
    .filter(
      (session) =>
        session.id !== excludedSession && Date.parse(session.date) < before,
    )
    .flatMap((session) =>
      (session.exercises ?? [])
        .filter((exercise) => exercise.id === exerciseId)
        .flatMap((exercise) =>
          (exercise.performedSets ?? []).flatMap((set) => {
            const value = performance(set, session.weightUnit ?? "kg");
            return value ? [value] : [];
          }),
        ),
    );
  return sets.map((set) => {
    const current = performance(set, unit, selectedMetric);
    if (!current) return [];
    const comparable = history.filter((old) => old.metric === current.metric);
    const records: PersonalRecord[] = [];
    // A first logged performance establishes a baseline instead of inventing a prior record.
    if (comparable.length) {
      if (
        current.weight >
        Math.max(...comparable.map((old) => old.weight)) + 0.05
      )
        records.push("weight");
      const sameLoad = comparable.filter(
        (old) => Math.abs(old.weight - current.weight) <= 0.05,
      );
      if (
        sameLoad.length &&
        current.quantity > Math.max(...sameLoad.map((old) => old.quantity))
      )
        records.push(current.metric);
    }
    history.push(current);
    return records;
  });
}

/** Current best performances, separated by exercise, metric and equivalent load. */
export function recordPanel(snapshot: Snapshot) {
  const best = new Map<
    string,
    {
      exerciseId: string;
      kind: string;
      weight: number;
      quantity: number;
      metric: "reps" | "seconds";
      sessionId: string;
      date: string;
    }
  >();
  for (const session of [...snapshot.sessions].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  )) {
    for (const exercise of session.exercises ?? [])
      for (const set of exercise.performedSets ?? []) {
        if (set.type === "warmup") continue;
        const value = performance(set, session.weightUnit ?? "kg");
        if (!value) continue;
        const candidate = {
          exerciseId: exercise.id,
          ...value,
          sessionId: session.id,
          date: session.date,
        };
        const weightKey = `${exercise.id}:${value.metric}:weight`;
        const oldWeight = best.get(weightKey);
        if (
          value.weight > 0 &&
          (!oldWeight ||
            value.weight > oldWeight.weight + 0.05 ||
            (Math.abs(value.weight - oldWeight.weight) <= 0.05 &&
              value.quantity > oldWeight.quantity))
        )
          best.set(weightKey, { ...candidate, kind: "weight" });
        const key = `${exercise.id}:${value.metric}:${Math.round(value.weight * 10)}`;
        const old = best.get(key);
        if (!old || value.quantity > old.quantity)
          best.set(key, { ...candidate, kind: value.metric });
      }
  }
  return [...best.values()].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}
