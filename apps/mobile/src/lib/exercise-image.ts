import { exerciseImage } from "@fitty/core/data/exercises";
import type { CatalogExercise } from "@fitty/core/domain/workouts";
import { env } from "@/lib/env";

/** The user's own photo when the exercise has one, else the catalog picture. */
export function exerciseSource(
  exercise: CatalogExercise,
  gender?: string,
): string {
  return (
    exercise.photos?.[0] ?? `${env.apiUrl}${exerciseImage(exercise, gender)}`
  );
}
