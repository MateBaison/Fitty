/** Routines a free account can keep; paid plans may raise this later. */
export const maxRoutines = 3;
export function canAddRoutine(snapshot: { routines: readonly unknown[] }) {
  return snapshot.routines.length < maxRoutines;
}
export const routineLimitMessage = {
  es: "Llegaste al límite de 3 rutinas. Eliminá una para crear otra.",
  en: "You reached the limit of 3 routines. Delete one to create another.",
} as const;
