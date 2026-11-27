import type { Routine } from "./schemas/snapshot";

type Day = Routine["days"][number];

/** A superset needs two different exercises that are still in the day. */
function tidySupersets(day: Day) {
  day.supersets = day.supersets
    ?.map((group) => group.filter((id) => day.items.includes(id)))
    .filter((group) => group.length > 1);
}

/** Takes one exercise out of a routine day, and out of a superset it leaves. */
export function removeRoutineExercise(day: Day, index: number) {
  if (day.items.splice(index, 1).length) tidySupersets(day);
}

/**
 * Puts another exercise in the same position. It also takes over the superset of
 * the old one, unless it already belongs to a superset of its own.
 */
export function replaceRoutineExercise(day: Day, index: number, id: string) {
  const previous = day.items[index];
  if (previous === undefined || previous === id) return;
  day.items[index] = id;
  if (!day.items.includes(previous)) {
    const grouped = day.supersets?.some((group) => group.includes(id));
    day.supersets = day.supersets?.map((group) =>
      group.flatMap((item) =>
        item !== previous ? [item] : grouped ? [] : [id],
      ),
    );
  }
  tidySupersets(day);
}
