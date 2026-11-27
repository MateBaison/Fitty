import {
  exercisePhotoSchema,
  MAX_EXERCISE_PHOTOS,
  type Snapshot,
} from "./schemas/snapshot";

/**
 * Photos travel inside the account snapshot and the mobile API rejects bodies
 * over 4.4 MB, so new photos stop being accepted before syncing would break.
 */
export const SNAPSHOT_PHOTO_LIMIT = 4_000_000;

export function photosFit(
  snapshot: Snapshot,
  photos: readonly string[],
): boolean {
  return (
    JSON.stringify(snapshot).length + JSON.stringify(photos).length <=
    SNAPSHOT_PHOTO_LIMIT
  );
}

/** Reads stored photos tolerantly: anything that is not a safe image is skipped. */
export function savedExercisePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (photo): photo is string => exercisePhotoSchema.safeParse(photo).success,
    )
    .slice(0, MAX_EXERCISE_PHOTOS);
}
