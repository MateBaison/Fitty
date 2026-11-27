import { describe, expect, it } from "vitest";
import { photosFit, SNAPSHOT_PHOTO_LIMIT } from "../src/domain/exercise-photos";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import { decodeRoutine, encodeRoutine } from "../src/domain/sharing";
import { customExerciseFormSchema } from "../src/domain/schemas/snapshot";
import { findExercise } from "../src/domain/workouts";

const photo = "data:image/jpeg;base64,AAAA";
const exercise = {
  id: "custom-photo",
  name: "Mi máquina",
  group: "Espalda" as const,
  equipment: "Máquina" as const,
  tracking: "reps" as const,
  steps: [],
};

describe("custom exercise photos", () => {
  it("accepts up to three safe images", () => {
    const parse = (photos: string[]) =>
      customExerciseFormSchema.safeParse({ ...exercise, photos }).success;
    expect(parse([photo, photo, photo])).toBe(true);
    expect(parse([photo, photo, photo, photo])).toBe(false);
    expect(parse(["https://example.invalid/a.jpg"])).toBe(false);
  });

  it("shows saved photos and keeps the exercise when one is unreadable", () => {
    const snapshot = createDefaultSnapshot();
    snapshot.customExercises.push({
      ...exercise,
      custom: true,
      photos: ["broken", photo],
    });
    expect(findExercise(snapshot, exercise.id)?.photos).toEqual([photo]);
  });

  it("leaves photos out of shared routines", () => {
    const snapshot = createDefaultSnapshot();
    snapshot.customExercises.push({
      ...exercise,
      custom: true,
      photos: [photo],
    });
    const routine = structuredClone(snapshot.routines[0]!);
    routine.days = [{ ...routine.days[0]!, items: [exercise.id] }];
    routine.days[0]!.supersets = [];
    const shared = decodeRoutine(encodeRoutine(snapshot, routine));
    expect(shared.customExercises[0]).not.toHaveProperty("photos");
  });

  it("stops accepting photos before the snapshot is too large to sync", () => {
    const snapshot = createDefaultSnapshot();
    expect(photosFit(snapshot, [photo])).toBe(true);
    expect(photosFit(snapshot, ["x".repeat(SNAPSHOT_PHOTO_LIMIT)])).toBe(false);
  });
});
