import { expect, test } from "vitest";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import {
  addWorkoutExercises,
  startWorkout,
  buildSession,
} from "../src/domain/workouts";
import { snapshotSchema } from "../src/domain/schemas/snapshot";

test("session additions preserve routine and recorded sets, persist with the right metric and save to history", () => {
  const snapshot = createDefaultSnapshot();
  startWorkout(snapshot, "r1", "d1");
  const routine = structuredClone(snapshot.routines);
  const first = snapshot.workout!.entries[0]!;
  Object.assign(first.sets[0]!, {
    kg: 40,
    reps: 10,
    entered: true,
    done: true,
  });
  const before = structuredClone(snapshot.workout!.entries);
  const index = before.length;
  addWorkoutExercises(snapshot, ["plancha", "sentadilla", "plancha"]);
  expect(snapshot.routines).toEqual(routine);
  expect(snapshot.workout!.entries.slice(0, index)).toEqual(before);
  expect(snapshot.workout!.entries).toHaveLength(index + 2);
  const restored = snapshotSchema.parse(JSON.parse(JSON.stringify(snapshot)));
  const added = restored.workout!.entries[index]!;
  expect(added.tracking).toBe("seconds");
  expect(
    added.sets.every(
      (set) => set.seconds === null && !set.entered && !set.done,
    ),
  ).toBe(true);
  expect(restored.workout!.openExercises).toContain(index);
  Object.assign(added.sets[0]!, { seconds: 30, entered: true, done: true });
  const session = buildSession(
    restored,
    restored.workout!.entries,
    { routine: "R", day: "D" },
    new Date().toISOString(),
    {
      color: "#4b9bff",
      comment: "",
      photos: [],
      bodyWeightStartKg: null,
      bodyWeightEndKg: null,
    },
  );
  expect(
    session.exercises?.find((exercise) => exercise.id === "plancha")
      ?.performedSets?.[0]?.seconds,
  ).toBe(30);
});

test("invalid additions are rejected atomically", () => {
  const snapshot = createDefaultSnapshot();
  expect(() => addWorkoutExercises(snapshot, ["plancha"])).toThrow();
  startWorkout(snapshot, "r1", "d1");
  const before = structuredClone(snapshot);
  expect(() =>
    addWorkoutExercises(snapshot, ["plancha", "invalid-id"]),
  ).toThrow();
  expect(snapshot).toEqual(before);
});
