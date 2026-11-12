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
  expect(isDeleteConfirmation("en", "DELETE")).toBe(true);
  expect(isDeleteConfirmation("en", "delete")).toBe(false);
  expect(isDeleteConfirmation("en", "ELIMINAR")).toBe(false);
  expect(isDeleteConfirmation("pt", "EXCLUIR")).toBe(true);
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

test("choosing a suggested routine replaces only the untouched starter routine", async () => {
  const { createDefaultSnapshot } = await import("../src/domain/legacy/read-snapshot");
  const { dropUntouchedDefaultRoutine } = await import(
    "../src/domain/onboarding-routine"
  );
  const fresh = createDefaultSnapshot();
  expect(fresh.routines).toHaveLength(1);
  expect(dropUntouchedDefaultRoutine(fresh)).toBe(true);
  expect(fresh.routines).toHaveLength(0);
  expect(fresh.selected).toBeNull();
  const edited = createDefaultSnapshot();
  edited.routines[0]!.name = "Mine";
  expect(dropUntouchedDefaultRoutine(edited)).toBe(false);
  expect(edited.routines).toHaveLength(1);
});

test("regenerating leaves only the latest automatic routine", async () => {
  const { createDefaultSnapshot } = await import("../src/domain/legacy/read-snapshot");
  const { dropAutomaticRoutines, dropUntouchedDefaultRoutine } = await import(
    "../src/domain/onboarding-routine"
  );
  const { createGuidedRoutine } = await import("../src/domain/training-setup");
  let n = 0;
  const make = (variation: number) =>
    createGuidedRoutine(
      { mode: "auto", experience: "beginner", days: 2, goal: "Fuerza e hipertrofia", groups: ["Pectorales", "Espalda"], variation },
      { makeId: () => `id${++n}`, language: "es" },
    );
  const snapshot = createDefaultSnapshot();
  for (let i = 0; i < 4; i++) {
    dropAutomaticRoutines(snapshot);
    dropUntouchedDefaultRoutine(snapshot);
    const routine = make(i);
    snapshot.routines.push(routine);
    snapshot.selected = routine.id;
  }
  expect(snapshot.routines).toHaveLength(1);
  expect(snapshot.selected).toBe(snapshot.routines[0]!.id);
});

test("reset confirmation word follows the language", async () => {
  const { resetConfirmationWord, isResetConfirmation, resetConfirmationLabel } =
    await import("../src/data/translations");
  expect(resetConfirmationWord("es")).toBe("REINICIAR");
  expect(resetConfirmationWord("en")).toBe("RESET");
  expect(isResetConfirmation("en", "RESET")).toBe(true);
  expect(isResetConfirmation("en", "REINICIAR")).toBe(false);
  expect(resetConfirmationLabel("en")).toBe("Type RESET to confirm");
  expect(resetConfirmationLabel("de")).toContain("ZURÜCKSETZEN");
  for (const lang of ["fr", "zh", "hi", "ar", "de", "it", "pt"])
    expect(resetConfirmationLabel(lang)).not.toContain("REINICIAR");
});
