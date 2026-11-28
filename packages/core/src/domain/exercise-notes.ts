import type { Snapshot } from "./schemas/snapshot";

export const EXERCISE_NOTE_MAX = 1000;

/**
 * The standing note of an exercise (how to set up the machine, cues, warnings).
 * It belongs to the account, not to one workout, so it shows every time the
 * exercise is performed. Per-workout comments live on the workout entry.
 */
export function exerciseNote(snapshot: Snapshot, id: string): string {
  const notes = snapshot.settings.exerciseNotes;
  return notes && Object.hasOwn(notes, id) ? notes[id]! : "";
}

/** Saves the note of an exercise; an empty text removes it. */
export function setExerciseNote(draft: Snapshot, id: string, text: string) {
  const note = text.trim().slice(0, EXERCISE_NOTE_MAX);
  const notes = { ...draft.settings.exerciseNotes };
  if (note) notes[id] = note;
  else delete notes[id];
  draft.settings.exerciseNotes = notes;
}
