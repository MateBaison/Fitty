import { expect, test } from "vitest";
import {
  createGuidedRoutine,
  recommendedTrainingDays,
} from "../src/domain/training-setup";
import { muscleGroups } from "../src/domain/schemas/exercise";
import { readSnapshot } from "../src/domain/legacy/read-snapshot";
const options = { makeId: () => crypto.randomUUID(), language: "es" };
test("guided routine uses bounded editable days, selected zones and goal", () => {
  const routine = createGuidedRoutine(
    {
      mode: "auto",
      experience: "beginner",
      days: 2,
      goal: "Mejorar condición física",
      groups: ["Piernas", "Glúteos"],
    },
    options,
  );
  expect(routine.days).toHaveLength(2);
  expect(routine.days.every((day) => day.items.length > 0)).toBe(true);
  expect(routine.goal).toBe("Mejorar condición física");
  expect(recommendedTrainingDays("beginner")).toBe(2);
  expect(recommendedTrainingDays("returning")).toBe(2);
  expect(recommendedTrainingDays("regular")).toBe(3);
  expect(recommendedTrainingDays("experienced")).toBe(4);
});
test("manual setup makes independent empty days without inventing performed sets", () => {
  const routine = createGuidedRoutine(
    {
      mode: "custom",
      experience: "experienced",
      days: 4,
      goal: "Fuerza e hipertrofia",
      groups: [],
    },
    options,
  );
  expect(routine.days).toHaveLength(4);
  expect(new Set(routine.days.map((day) => day.id)).size).toBe(4);
  expect(routine.days.every((day) => day.items.length === 0)).toBe(true);
});
test("new routine commands reject invalid days and empty automatic selections", () => {
  for (const days of [0, 7, 2.5])
    expect(() =>
      createGuidedRoutine(
        {
          mode: "auto",
          experience: "beginner",
          days,
          goal: "Fuerza e hipertrofia",
          groups: muscleGroups,
        },
        options,
      ),
    ).toThrow();
  expect(() =>
    createGuidedRoutine(
      {
        mode: "auto",
        experience: "beginner",
        days: 2,
        goal: "Fuerza e hipertrofia",
        groups: [],
      },
      options,
    ),
  ).toThrow();
  const result = readSnapshot({
    profile: {
      name: "Existing",
      country: "Old country name",
      trainingExperience: "legacy",
      privateMetadata: "keep",
    },
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.snapshot.profile.privateMetadata).toBe("keep");
});
