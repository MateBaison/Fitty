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

type OrderedEntry = { id: string; superset?: string };

/**
 * A key for each exercise of a workout that survives reordering, so screens and
 * the rest timer keep following the same exercise after it moves.
 */
export function workoutEntryKeys(entries: readonly OrderedEntry[]): string[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const occurrence = seen.get(entry.id) ?? 0;
    seen.set(entry.id, occurrence + 1);
    return `${entry.id}#${occurrence}`;
  });
}

/**
 * The movable pieces of a workout, as entry indexes in display order: one
 * exercise, or all the members of a superset together.
 */
export function workoutBlocks(entries: readonly OrderedEntry[]): number[][] {
  const blocks: number[][] = [];
  const supersets = new Map<string, number[]>();
  entries.forEach((entry, index) => {
    const existing = entry.superset ? supersets.get(entry.superset) : undefined;
    if (existing) return void existing.push(index);
    const block = [index];
    blocks.push(block);
    if (entry.superset) supersets.set(entry.superset, block);
  });
  return blocks;
}

/** Moves one block of the workout in progress; the saved routine is not touched. */
export function moveWorkoutBlock(draft: Snapshot, from: number, to: number) {
  const workout = draft.workout;
  if (!workout || from === to) return;
  const blocks = workoutBlocks(workout.entries);
  if (!blocks[from] || !blocks[to]) return;
  // Exercises opened by default (none recorded yet) keep that state when moving.
  const open = workout.openExercises ?? [0];
  const [moved] = blocks.splice(from, 1);
  blocks.splice(to, 0, moved!);
  const order = blocks.flat();
  const position = (index: number) => order.indexOf(index);
  workout.entries = order.map((index) => workout.entries[index]!);
  workout.openExercises = open.map(position).filter((index) => index >= 0);
  workout.index = Math.max(0, position(workout.index));
}
