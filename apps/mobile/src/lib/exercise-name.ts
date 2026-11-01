import { translate } from "@fitty/core/data/translations";

/** Shorter Spanish names for display only; stored names and ids stay untouched. */
export function exerciseName(language: string, name: string) {
  const text = translate(language, name, name);
  if (language !== "es") return text;
  return text
    .replace(/^Press de banca/, "Press banca")
    .replace(/^Press de hombros?/, (match) => match.replace(" de", ""));
}
