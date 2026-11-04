import { shortExerciseName } from "@fitty/core/data/exercise-name";
import { translate } from "@fitty/core/data/translations";
import { useApp } from "@/state/app-provider";

/** Exercise names in the account language; Spanish also gets the shorter display form. */
export function useExerciseName() {
  const language = useApp().snapshot.settings.language ?? "es";
  return (name: string) =>
    language === "es"
      ? shortExerciseName(name)
      : translate(language, name, name);
}
