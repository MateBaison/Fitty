import { expect, test } from "vitest";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import { recentImprovements } from "../src/domain/progress";
test("recent improvements use 28 days, exclude future and warmups, retain all improved exercises and compare strongest prior sets", () => {
  const s = createDefaultSnapshot();
  s.sessions = [];
  const now = new Date("2026-10-11T12:00:00Z");
  const add = (
    id: string,
    date: string,
    sets: { kg: number; reps?: number; seconds?: number; type?: string }[],
    unit: "kg" | "lb" = "kg",
  ) =>
    s.sessions.push({
      id: crypto.randomUUID(),
      date,
      routine: "R",
      day: "D",
      weightUnit: unit,
      exercises: [{ id, performedSets: sets }],
    });
  add("weight", "2026-08-01", [{ kg: 40, reps: 12 }]);
  add("weight", "2026-10-01", [{ kg: 50, reps: 8 }]);
  add("reps", "2026-09-01", [
    { kg: 20, reps: 12 },
    { kg: 20, reps: 6 },
  ]);
  add("reps", "2026-10-02", [{ kg: 20, reps: 13 }]);
  add("seconds", "2026-09-01", [{ kg: 0, seconds: 30 }]);
  add("seconds", "2026-10-03", [{ kg: 0, seconds: 45 }]);
  add("fourth", "2026-09-01", [{ kg: 10, reps: 8 }]);
  add("fourth", "2026-10-04", [{ kg: 22.0462, reps: 10 }], "lb");
  add("old", "2026-08-01", [{ kg: 10, reps: 10 }]);
  add("old", "2026-09-01", [{ kg: 20, reps: 10 }]);
  add("future", "2026-09-01", [{ kg: 10, reps: 10 }]);
  add("future", "2026-10-12", [{ kg: 20, reps: 10 }]);
  add("notBetter", "2026-09-01", [
    { kg: 20, reps: 12 },
    { kg: 10, reps: 6 },
  ]);
  add("notBetter", "2026-10-02", [{ kg: 20, reps: 10 }]);
  add("warmup", "2026-09-01", [{ kg: 10, reps: 10, type: "warmup" }]);
  add("warmup", "2026-10-02", [{ kg: 20, reps: 10, type: "warmup" }]);
  add("differentMetric", "2026-09-01", [{ kg: 0, reps: 10 }]);
  add("differentMetric", "2026-10-02", [{ kg: 0, seconds: 40 }]);
  const result = recentImprovements(s, now);
  expect(result.map((item) => item.id)).toEqual([
    "fourth",
    "seconds",
    "reps",
    "weight",
  ]);
  expect(result.find((item) => item.id === "weight")?.result.kind).toBe(
    "weight",
  );
  expect(result.find((item) => item.id === "fourth")?.result.kind).toBe(
    "quantity",
  );
  expect(
    result.find((item) => item.id === "seconds")?.result.after.metric,
  ).toBe("seconds");
});

test("an independent three-month window includes older improvements without changing the default month", () => {
  const snapshot = createDefaultSnapshot();
  snapshot.sessions = [10, 12].map((kg, i) => ({
    id: `older-${i}`,
    date: `2026-08-${10 + i}T12:00:00`,
    routine: "r",
    day: "d",
    exercises: [
      {
        id: "sentadilla",
        performedSets: [{ kg, reps: 8, entered: true, done: true }],
      },
    ],
  }));
  const now = new Date("2026-10-18T12:00:00");
  expect(recentImprovements(snapshot, now)).toHaveLength(0);
  expect(
    recentImprovements(snapshot, now, new Date("2026-07-18T12:00:00")),
  ).toHaveLength(1);
});
