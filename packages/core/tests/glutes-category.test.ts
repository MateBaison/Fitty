import { expect, test } from "vitest";
import {
  availableExercises,
  exercises,
  gluteExerciseIds,
} from "../src/data/exercises";
import { buildAutomaticRoutine } from "../src/domain/calculations/automatic-routine";
import {
  createDefaultSnapshot,
  readSnapshotJson,
} from "../src/domain/legacy/read-snapshot";
import { findExercise, startWorkout } from "../src/domain/workouts";
import { weeklyData } from "../src/domain/progress";

test("dedicated glute movements move together while shared leg and abs choices remain", () => {
  expect(
    availableExercises
      .filter((e) => e.group === "Glúteos")
      .map((e) => e.id)
      .sort(),
  ).toEqual([...gluteExerciseIds].sort());
  expect(gluteExerciseIds).toHaveLength(13);
  for (const id of [
    "sentadilla",
    "peso-muerto-rumano-con-barra",
    "step-up-con-mancuernas",
  ]) {
    expect(exercises.find((e) => e.id === id)?.group).toBe("Piernas");
  }
  expect(
    exercises.find(
      (e) => e.id === "elevaciones-de-cadera-acostado-lateralmente",
    )?.group,
  ).toBe("Abdominales");
});

test("automatic glute routines work for every day count and stay in lower body splits", () => {
  for (let days = 1; days <= 7; days++) {
    const routine = buildAutomaticRoutine(
      { groups: ["Glúteos"], days },
      { makeId: () => "glutes", language: "es" },
    );
    expect(routine.days).toHaveLength(days);
    for (const day of routine.days) {
      expect(day.items.length).toBeGreaterThan(0);
      expect(new Set(day.items).size).toBe(day.items.length);
      for (const id of day.items)
        expect(gluteExerciseIds as readonly string[]).toContain(id);
    }
  }
  const routine = buildAutomaticRoutine(
    { groups: ["Pectorales", "Glúteos", "Piernas"], days: 2 },
    { makeId: () => "split", language: "es" },
  );
  expect(routine.days[0]?.name).not.toContain("Glúteos");
  expect(routine.days[1]?.name).toContain("Glúteos");
});

test("reclassification preserves historical groups and saved routine references", () => {
  const snapshot = createDefaultSnapshot();
  const id = "elevaciones-de-cadera-con-barra";
  snapshot.routines[0]!.days[0]!.items = [id];
  snapshot.sessions = [
    {
      id: "old",
      date: "2026-10-18",
      routine: snapshot.routines[0]!.name,
      day: snapshot.routines[0]!.days[0]!.name,
      exercises: [{ id, group: "Piernas", sets: 3 }],
    },
  ];
  const result = readSnapshotJson(JSON.stringify(snapshot));
  if (!result.ok) throw new Error("Could not restore snapshot");
  const restored = result.snapshot;
  expect(restored.sessions).toEqual(snapshot.sessions);
  expect(findExercise(restored, id)?.group).toBe("Glúteos");
  expect(
    weeklyData(restored, 1, new Date("2026-10-18T12:00:00"))[0]?.groups.Piernas,
  ).toBe(3);
  startWorkout(
    restored,
    restored.routines[0]!.id,
    restored.routines[0]!.days[0]!.id,
  );
  expect(restored.workout?.entries[0]?.id).toBe(id);
});
