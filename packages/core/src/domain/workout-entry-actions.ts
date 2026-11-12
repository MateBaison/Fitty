import type { Snapshot } from "./schemas/snapshot";

const POUNDS_PER_KILOGRAM = 2.20462;

/**
 * Switches the account weight unit, converting the profile weight and the loads of
 * the workout in progress, exactly like the settings screen does.
 */
export function changeWeightUnit(draft: Snapshot, unit: "kg" | "lb") {
  if (unit === (draft.settings.weight ?? "kg")) return;
  const factor = unit === "lb" ? POUNDS_PER_KILOGRAM : 1 / POUNDS_PER_KILOGRAM;
  draft.profile.weight =
    Math.round(Number(draft.profile.weight ?? 75) * factor * 10) / 10;
  draft.workout?.entries.forEach((entry) =>
    entry.sets.forEach((set) => {
      if (set.kg != null) set.kg = Math.round(set.kg * factor * 10) / 10;
    }),
  );
  draft.settings.weight = unit;
}

/** A superset needs two exercises: when only one is left, it goes back to normal. */
function dissolveLonelySuperset(entries: { superset?: string }[], key?: string) {
  if (!key) return;
  const members = entries.filter((entry) => entry.superset === key);
  if (members.length < 2) for (const entry of members) delete entry.superset;
}

/** Takes one exercise out of its superset, keeping the others together if possible. */
export function leaveSuperset(draft: Snapshot, index: number) {
  const workout = draft.workout;
  const entry = workout?.entries[index];
  if (!workout || !entry?.superset) return;
  const key = entry.superset;
  delete entry.superset;
  dissolveLonelySuperset(workout.entries, key);
}

/** Removes an exercise from the workout in progress and keeps indexes consistent. */
export function removeWorkoutEntry(draft: Snapshot, index: number) {
  const workout = draft.workout;
  const entry = workout?.entries[index];
  if (!workout || !entry) return;
  workout.entries.splice(index, 1);
  dissolveLonelySuperset(workout.entries, entry.superset);
  if (workout.openExercises)
    workout.openExercises = workout.openExercises
      .filter((number) => number !== index)
      .map((number) => (number > index ? number - 1 : number));
  workout.index = Math.max(
    0,
    Math.min(workout.index > index ? workout.index - 1 : workout.index, workout.entries.length - 1),
  );
}
