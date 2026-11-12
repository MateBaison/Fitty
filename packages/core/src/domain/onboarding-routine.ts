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
      fingerprint(routine) === fingerprint(original),
  );
  if (index < 0) return false;
  draft.routines.splice(index, 1);
  if (draft.selected === original.id) draft.selected = null;
  return true;
}
