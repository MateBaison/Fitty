import { fingerprint } from "../storage/fingerprint";
import { createDefaultSnapshot } from "./legacy/read-snapshot";
import type { Routine, Snapshot } from "./schemas/snapshot";

/** The routine every new account starts with ("Rutina principal"), as shipped. */
export function defaultRoutine(): Routine | undefined {
  return createDefaultSnapshot().routines[0];
}
/**
 * Removes the starter routine when the person never touched it, so choosing a
 * suggested routine during account setup leaves exactly one routine.
 * Returns true when something was removed.
 */
export function dropUntouchedDefaultRoutine(draft: Snapshot): boolean {
  const original = defaultRoutine();
  if (!original) return false;
  const index = draft.routines.findIndex(
    (routine) =>
      routine.id === original.id &&
      (routine.name === original.name ||
        fingerprint(routine) === fingerprint(original)),
  );
  if (index < 0) return false;
  draft.routines.splice(index, 1);
  if (draft.selected === original.id) draft.selected = null;
  return true;
}

/** Routines built by the automatic generator have days named `<routine id>-d<n>`. */
export function isAutomaticRoutine(routine: Routine): boolean {
  return (
    routine.days.length > 0 &&
    routine.days.every((day) => day.id.startsWith(`${routine.id}-d`))
  );
}
/**
 * Removes every automatically generated routine, so regenerating during account
 * setup always leaves only the latest suggestion. Returns how many were removed.
 */
export function dropAutomaticRoutines(draft: Snapshot): number {
  const before = draft.routines.length;
  draft.routines = draft.routines.filter(
    (routine) => !isAutomaticRoutine(routine),
  );
  if (!draft.routines.some((routine) => routine.id === draft.selected))
    draft.selected = draft.routines[0]?.id ?? null;
  return before - draft.routines.length;
}
