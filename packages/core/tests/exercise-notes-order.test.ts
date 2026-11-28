import { expect, test } from "vitest";
import {
  EXERCISE_NOTE_MAX,
  exerciseNote,
  setExerciseNote,
} from "../src/domain/exercise-notes";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import { snapshotSchema, type Snapshot } from "../src/domain/schemas/snapshot";
import { encodeRoutine } from "../src/domain/sharing";
import {
  moveWorkoutBlock,
  workoutBlocks,
  workoutEntryKeys,
} from "../src/domain/workout-entry-actions";

const workout = (
  entries: { id: string; superset?: string }[],
  extra: Partial<NonNullable<Snapshot["workout"]>> = {},
): NonNullable<Snapshot["workout"]> => ({
  rid: "r",
  did: "d",
  started: 1,
  index: 0,
  entries: entries.map((entry) => ({ ...entry, sets: [] })),
  ...extra,
});

test("an exercise note is saved per exercise, trimmed, bounded and removable", () => {
  const snapshot = createDefaultSnapshot();
  expect(exerciseNote(snapshot, "press")).toBe("");
  expect(exerciseNote(snapshot, "toString")).toBe("");
  setExerciseNote(snapshot, "press", "  Seat in position 4  ");
  expect(exerciseNote(snapshot, "press")).toBe("Seat in position 4");
  expect(snapshotSchema.parse(snapshot).settings.exerciseNotes).toEqual({
    press: "Seat in position 4",
  });
  setExerciseNote(snapshot, "row", "x".repeat(EXERCISE_NOTE_MAX + 5));
  expect(exerciseNote(snapshot, "row")).toHaveLength(EXERCISE_NOTE_MAX);
  setExerciseNote(snapshot, "press", "   ");
  expect(snapshot.settings.exerciseNotes).not.toHaveProperty("press");
  expect(exerciseNote(snapshot, "row")).not.toBe("");
});

test("shared routines never carry exercise notes", () => {
  const snapshot = createDefaultSnapshot();
  const routine = snapshot.routines[0]!;
  const id = routine.days[0]!.items[0]!;
  setExerciseNote(snapshot, id, "private note");
  const token = encodeRoutine(snapshot, routine);
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  expect(decoded).toContain(id);
  expect(decoded).not.toContain("private note");
});

test("superset members move as one block and keys follow their exercise", () => {
  const entries = [
    { id: "a" },
    { id: "b", superset: "s" },
    { id: "c" },
    { id: "d", superset: "s" },
    { id: "a" },
  ];
  expect(workoutBlocks(entries)).toEqual([[0], [1, 3], [2], [4]]);
  expect(workoutEntryKeys(entries)).toEqual([
    "a#0",
    "b#0",
    "c#0",
    "d#0",
    "a#1",
  ]);
});

test("moving a block keeps open exercises and the current one on the same exercise", () => {
  const snapshot = createDefaultSnapshot();
  snapshot.workout = workout(
    [
      { id: "a" },
      { id: "b", superset: "s" },
      { id: "c", superset: "s" },
      { id: "d" },
    ],
    { index: 3, openExercises: [0, 3] },
  );
  const saved = JSON.stringify(snapshot.routines);
  moveWorkoutBlock(snapshot, 2, 0);
  expect(snapshot.workout.entries.map((entry) => entry.id)).toEqual([
    "d",
    "a",
    "b",
    "c",
  ]);
  expect(snapshot.workout.index).toBe(0);
  expect(snapshot.workout.openExercises).toEqual([1, 0]);
  moveWorkoutBlock(snapshot, 2, 0);
  expect(snapshot.workout.entries.map((entry) => entry.id)).toEqual([
    "b",
    "c",
    "d",
    "a",
  ]);
  expect(JSON.stringify(snapshot.routines)).toBe(saved);
});

test("the exercise open by default stays open after moving, and bad moves are ignored", () => {
  const snapshot = createDefaultSnapshot();
  snapshot.workout = workout([{ id: "a" }, { id: "b" }]);
  moveWorkoutBlock(snapshot, 0, 5);
  expect(snapshot.workout.openExercises).toBeUndefined();
  moveWorkoutBlock(snapshot, 0, 1);
  expect(snapshot.workout.entries.map((entry) => entry.id)).toEqual(["b", "a"]);
  expect(snapshot.workout.openExercises).toEqual([1]);
});
