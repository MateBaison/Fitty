import { expect, test } from "vitest";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import {
  lastSetCount,
  startWorkout,
  switchEntryMetric,
  type Entry,
} from "../src/domain/workouts";
import { weeklySummary, lifetimeSummary } from "../src/domain/progress";
import { snapshotSchema } from "../src/domain/schemas/snapshot";
test("latest recorded set count initializes blanks and groups drops once", () => {
  const s = createDefaultSnapshot(),
    id = "press-de-banca-con-barra";
  expect(lastSetCount(s, id)).toBe(3);
  s.sessions = [
    {
      id: "old",
      date: "2026-09-01",
      routine: "Rutina principal",
      day: "Pecho y tríceps",
      exercises: [{ id, sets: 5 }],
    },
    {
      id: "new",
      date: "2026-10-01",
      routine: "R",
      day: "D",
      exercises: [
        {
          id,
          performedSets: [
            { kg: 20, reps: 10, type: "drop", dropGroup: "x" },
            { kg: 15, reps: 8, type: "drop", dropGroup: "x" },
            { kg: 20, reps: 9 },
            { kg: 20, reps: 8 },
          ],
        },
      ],
    },
  ];
  expect(lastSetCount(s, id)).toBe(3);
  s.sessions[0]!.date = "2026-10-02";
  expect(lastSetCount(s, id)).toBe(5);
  startWorkout(s, "r1", "d1");
  // Same routine and day: previous 5 sets plus the warm-up added to the first compound lift.
  expect(s.workout?.entries[0]?.sets).toHaveLength(6);
  expect(s.workout?.entries[0]?.sets[0]?.type).toBe("warmup");
  // Suggested rep targets may be prefilled, but nothing counts as recorded until entered.
  expect(s.workout?.entries[0]?.sets[0]?.reps).toBeNull();
  expect(
    s.workout?.entries[0]?.sets.every((set) => set.entered === false),
  ).toBe(true);
});
test("metric switch restores values and original flags even through cache serialization", () => {
  const s = createDefaultSnapshot();
  const entry: Entry = {
    id: "plancha",
    tracking: "reps",
    sets: [{ kg: 20, reps: 12, entered: true, done: true }],
  };
  switchEntryMetric(entry, "reps", "seconds");
  expect(entry.sets[0]?.reps).toBe(12);
  expect(entry.sets[0]?.entered).toBe(false);
  Object.assign(entry.sets[0]!, { seconds: 40, entered: true, done: false });
  switchEntryMetric(entry, "seconds", "reps");
  expect(entry.sets[0]?.done).toBe(true);
  expect(entry.sets[0]?.kg).toBe(20);
  s.workout = { rid: "r1", did: "d1", started: 1, index: 0, entries: [entry] };
  const restored = snapshotSchema.parse(JSON.parse(JSON.stringify(s))).workout!
    .entries[0]!;
  switchEntryMetric(restored, "reps", "seconds");
  expect(restored.sets[0]?.seconds).toBe(40);
  expect(restored.sets[0]?.entered).toBe(true);
  expect(restored.sets[0]?.done).toBe(false);
  switchEntryMetric(restored, "seconds", "reps");
  expect(restored.sets[0]?.reps).toBe(12);
  expect(restored.sets[0]?.done).toBe(true);
});
test("weekly and lifetime volume normalize units, keep unknown durations and count distinct local training dates", () => {
  const s = createDefaultSnapshot();
  s.sessions = [
    {
      id: "a",
      date: "2026-10-12T12:00:00",
      routine: "R",
      day: "D",
      volume: 100,
      weightUnit: "kg",
      duration: 30,
    },
    {
      id: "b",
      date: "2026-10-12T18:00:00",
      routine: "R",
      day: "D",
      volume: 220.462,
      weightUnit: "lb",
      duration: null,
    },
    {
      id: "c",
      date: "2026-09-01T12:00:00",
      routine: "R",
      day: "D",
      volumeKg: 50,
      duration: 20,
    },
  ];
  const weekly = weeklySummary(s, new Date(2026, 9, 12));
  expect(weekly.volumeKg).toBeCloseTo(200);
  expect(weekly.days[0]?.volumeKg).toBeCloseTo(200);
  const lifetime = lifetimeSummary(s);
  expect(lifetime.sessions).toBe(3);
  expect(lifetime.trainedDays).toBe(2);
  expect(lifetime.minutes).toBe(50);
  expect(lifetime.unknown).toBe(1);
  expect(lifetime.volumeKg).toBeCloseTo(250);
});
