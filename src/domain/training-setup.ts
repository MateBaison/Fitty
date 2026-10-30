import { z } from "zod";
import { muscleGroups, muscleGroupSchema } from "./schemas/exercise";
import type { Routine } from "./schemas/snapshot";
import { buildAutomaticRoutine } from "./calculations/automatic-routine";
import { translate } from "@/data/translations";
export const experienceSchema = z.enum([
  "beginner",
  "returning",
  "regular",
  "experienced",
]);
export type TrainingExperience = z.infer<typeof experienceSchema>;
/** Conservative, editable starting suggestions; not a medical prescription. */
export function recommendedTrainingDays(experience: TrainingExperience) {
  return { beginner: 2, returning: 2, regular: 3, experienced: 4 }[experience];
}
export const trainingSetupSchema = z.strictObject({
  experience: experienceSchema,
  mode: z.enum(["custom", "auto"]),
  days: z.number().int().min(1).max(6),
  goal: z.enum([
    "Baja grasa corporal",
    "Ganar masa corporal",
    "Fuerza e hipertrofia",
    "Mejorar resistencia cardiovascular",
    // Retained to read older clients and saved onboarding drafts.
    "Ganar masa muscular",
    "Mejorar condición física",
  ]),
  groups: z.array(muscleGroupSchema).max(muscleGroups.length),
  variation: z.number().int().min(0).max(1_000_000).default(0),
});
export function createGuidedRoutine(
  raw: unknown,
  options: { makeId: () => string; language: string },
): Routine {
  const input = trainingSetupSchema.parse(raw);
  if (input.mode === "auto" && !input.groups.length)
    throw new Error("Choose at least one muscle group");
  if (input.mode === "auto") {
    const routine = buildAutomaticRoutine(
      {
        groups: input.groups,
        days: input.days,
        goal: input.goal,
        variation: input.variation,
      },
      options,
    );
    return routine;
  }
  return {
    id: options.makeId(),
    name: translate(options.language, "Mi rutina", "My routine"),
    goal: input.goal,
    days: Array.from({ length: input.days }, (_, index) => ({
      id: options.makeId(),
      name: `${translate(options.language, "Día", "Day")} ${index + 1}`,
      items: [],
    })),
  };
}
