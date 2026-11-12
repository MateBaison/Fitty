import { expect, test } from "vitest";
import {
  deleteConfirmationLabel,
  deleteConfirmationWord,
  isDeleteConfirmation,
  languages,
} from "../src/data/translations";
import { buildAutomaticRoutine } from "../src/domain/calculations/automatic-routine";
import { canAddRoutine, maxRoutines } from "../src/domain/routine-limits";

test("an account can keep at most three routines", () => {
  expect(maxRoutines).toBe(3);
  expect(canAddRoutine({ routines: [1, 2] })).toBe(true);
  expect(canAddRoutine({ routines: [1, 2, 3] })).toBe(false);
});

test("the delete confirmation word follows the language of the account", () => {
  expect(deleteConfirmationWord("es")).toBe("ELIMINAR");
  expect(deleteConfirmationWord("en")).toBe("DELETE");
  expect(deleteConfirmationWord("de")).toBe("LÖSCHEN");
  expect(deleteConfirmationWord("unknown")).toBe("ELIMINAR");
  expect(isDeleteConfirmation("en", " delete ")).toBe(true);
  expect(isDeleteConfirmation("en", "ELIMINAR")).toBe(false);
  expect(isDeleteConfirmation("pt", "excluir")).toBe(true);
  for (const language of languages) {
    expect(deleteConfirmationLabel(language)).toContain(
      deleteConfirmationWord(language),
    );
    if (language !== "es")
      expect(deleteConfirmationLabel(language)).not.toContain("ELIMINAR");
  }
});

test("automatic routines are named in the chosen language, muscles included", () => {
  let next = 0;
  const routine = buildAutomaticRoutine(
    { groups: ["Pectorales", "Espalda"], days: 2 },
    { makeId: () => String(++next), language: "en" },
  );
  const names = [routine.name, ...routine.days.map((day) => day.name)].join(" ");
  expect(names).toContain("Automatic routine");
  expect(names).toContain("Day 1");
  expect(names).not.toMatch(/Pectorales|Espalda|Día/);
});
