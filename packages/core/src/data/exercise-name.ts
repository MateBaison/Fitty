/** Shorter Spanish names for display only; stored names, ids and search stay untouched. */
export function shortExerciseName(name: string) {
  return name
    .replace(/^Press de banca/, "Press banca")
    .replace(/^Press de hombros?/, (match) => match.replace(" de", ""));
}
