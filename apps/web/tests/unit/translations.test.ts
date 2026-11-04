import { expect, test } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { translate } from "@fitty/core/data/translations";
import legacy from "@fitty/core/data/legacy/translations.json";
import additions from "@fitty/core/data/ui-translations.json";

test("literal translated UI messages have entries in every additional language", () => {
  const keys = new Set<string>();
  for (const path of [
    ...globSync("src/**/*.tsx"),
    ...globSync("../mobile/src/**/*.{ts,tsx}"),
  ]) {
    for (const match of readFileSync(path, "utf8").matchAll(
      /\b(?:t|translate)\(\s*(?:language,\s*)?"([^"\n]+)"/g,
    ))
      keys.add(JSON.parse(`"${match[1]!}"`) as string);
  }
  const original: Record<string, Record<string, string>> = legacy;
  const added: Record<string, Record<string, string>> = additions;
  for (const language of ["fr", "zh", "hi", "ar", "de", "it", "pt"]) {
    const missing = [...keys].filter(
      (key) => !original[language]?.[key] && !added[language]?.[key],
    );
    expect(missing).toEqual([]);
  }
  expect(translate("en", "Objetivo de peso", "Objetivo de peso")).toBe(
    "Weight goal",
  );
  expect(translate("ar", "Resumen semanal", "Weekly summary")).toBe(
    "ملخص أسبوعي",
  );
});

test("every catalog exercise has a name in every language", async () => {
  const { exercises: exerciseCatalog } = await import("@fitty/core/data/exercises");
  const added: Record<string, Record<string, string>> = additions;
  for (const language of ["en", "fr", "zh", "hi", "ar", "de", "it", "pt"]) {
    const missing = exerciseCatalog
      .map((exercise) => exercise.name)
      .filter((name) => !added[language]?.[name]);
    expect(missing).toEqual([]);
  }
});
