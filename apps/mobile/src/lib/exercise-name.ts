import { shortExerciseName } from "@fitty/core/data/exercise-name";
import { translate } from "@fitty/core/data/translations";

/** Display name: translated, and shortened only in Spanish. */
export function exerciseName(language: string, name: string) {
  const text = translate(language, name, name);
  return language === "es" ? shortExerciseName(text) : text;
}
