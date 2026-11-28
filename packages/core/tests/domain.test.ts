import { describe, expect, test } from "vitest";
import {
  calorieMetrics,
  calorieTargets,
  macroMetrics,
  oneRepMax,
  weightGoal,
} from "../src/domain/calculations/calculators";
import {
  extraAmount,
  nutritionExtraGroups,
} from "../src/domain/calculations/nutrition-extras";
import { buildAutomaticRoutine } from "../src/domain/calculations/automatic-routine";
import { exercises } from "../src/data/exercises";
import { muscleGroups } from "../src/domain/schemas/exercise";
import { translate, textDirection } from "../src/data/translations";

const inputs = {
  formula: "male",
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 1.55,
};
describe("Phase 2 domain parity", () => {
  test("calories and all three targets match legacy golden values", () => {
    expect(calorieMetrics(inputs)).toEqual({ bmr: 1699, maintenance: 2633 });
    expect(calorieTargets(2633)).toEqual({
      loss: 2333,
      maintenance: 2633,
      gain: 2933,
    });
    expect(calorieMetrics({ ...inputs, formula: "female" })).toEqual({
      bmr: 1533,
      maintenance: 2376,
    });
    expect(() => calorieMetrics({ ...inputs, age: 15 })).toThrow();
  });
  test("macros set protein by body weight; 1RM retains Epley and one-rep exception", () => {
    const at = (split: string, calories = 3000, weightKg = 75) =>
      macroMetrics({ calories, weightKg, meals: 3, split });
    expect(at("balanced").daily).toEqual({
      carbs: 390,
      protein: 135,
      fat: 100,
    });
    expect(at("balanced").percentages).toEqual({
      carbsPct: 52,
      proteinPct: 18,
      fatPct: 30,
    });
    expect(at("balanced").perMeal).toEqual({
      calories: 1000,
      carbs: 130,
      protein: 45,
      fat: 33,
    });
    expect(at("protein").daily).toEqual({ carbs: 360, protein: 165, fat: 100 });
    expect(at("lowerCarb").daily).toEqual({
      carbs: 316,
      protein: 135,
      fat: 133,
    });
    expect(at("keto").daily).toEqual({ carbs: 38, protein: 135, fat: 256 });
    expect(at("balanced").proteinLimited).toBe(false);
    // 2.2 g/kg of 120 kg would be 1056 kcal of 1500: capped at 40 %.
    const capped = at("protein", 1500, 120);
    expect(capped.proteinLimited).toBe(true);
    expect(capped.daily).toEqual({ carbs: 113, protein: 150, fat: 50 });
    // Even the most extreme accepted inputs leave nothing negative.
    for (const split of ["balanced", "protein", "lowerCarb", "keto"])
      for (const value of Object.values(at(split, 1000, 400).daily))
        expect(value).toBeGreaterThan(0);
    expect(() =>
      macroMetrics({ calories: 3000, meals: 3, split: "keto" }),
    ).toThrow();
    expect(oneRepMax({ weight: 100, reps: 5 })).toBeCloseTo(116.6666667);
    expect(oneRepMax({ weight: 100, reps: 1 })).toBe(100);
    expect(() => oneRepMax({ weight: 100, reps: 11 })).toThrow();
  });
  test("weight goal matches legacy range, milestones and safety messages", () => {
    const result = weightGoal({ ...inputs, targetKg: 70 });
    if (result.kind !== "estimate") throw new Error("Missing estimate");
    expect([result.fastWeeks, result.slowWeeks]).toEqual([14, 27]);
    expect(result.milestones[0]?.calories).toBe(2330);
    expect(result.milestones.at(-1)?.kg).toBe(70);
    expect(weightGoal({ ...inputs, targetKg: 75 })).toEqual({
      kind: "message",
      reason: "already-at-target",
    });
    expect(weightGoal({ ...inputs, targetKg: 50 })).toEqual({
      kind: "message",
      reason: "low-weight",
    });
  });
  test("all 511 nonempty group selections work for 1–7 days with canonical IDs", () => {
    const known = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    for (let mask = 1; mask < 1 << muscleGroups.length; mask++) {
      const groups = muscleGroups.filter(
        (_, index) => (mask & (1 << index)) !== 0,
      );
      for (let days = 1; days <= 7; days++) {
        const routine = buildAutomaticRoutine(
          { groups, days },
          { makeId: () => "test", language: "es" },
        );
        expect(routine.days).toHaveLength(days);
        const covered = new Set(
          routine.days.flatMap((day) =>
            day.items.map((id) => known.get(id)?.group),
          ),
        );
        expect(covered).toEqual(new Set(groups));
        expect(
          routine.days.every(
            (day) =>
              day.items.length > 0 &&
              new Set(day.items).size === day.items.length,
          ),
        ).toBe(true);
      }
    }
  });
  test("generation rejects empty/invalid requests and preserves explicit ID injection", () => {
    const options = { makeId: () => "fixed", language: "en" };
    expect(() =>
      buildAutomaticRoutine({ groups: [], days: 2 }, options),
    ).toThrow();
    expect(() =>
      buildAutomaticRoutine({ groups: ["Piernas"], days: 8 }, options),
    ).toThrow();
    const routine = buildAutomaticRoutine(
      { groups: ["Gemelos"], days: 2 },
      options,
    );
    expect(routine.id).toBe("rfixed");
    expect(routine.days[0]?.items).toEqual([
      "elevacion-de-gemelos-de-pie",
      "elevacion-de-gemelos-sentado",
    ]);
    expect(routine.days[1]?.items).toEqual([
      "elevacion-de-gemelos-sentado",
      "elevacion-de-gemelos-de-pie",
    ]);
    expect(routine.name).toBe("Automatic routine · 2 days");
  });
  test("translations keep original fallbacks and Arabic direction", () => {
    expect(translate("es", "Filtrar por equipo", "Filter equipment")).toBe(
      "Filtrar por equipo",
    );
    expect(translate("de", "Filtrar por equipo", "Filter equipment")).toBe(
      "Nach Gerät filtern",
    );
    expect(translate("unrecognized", "No disponible", "Fallback")).toBe(
      "Fallback",
    );
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("pt")).toBe("ltr");
  });
});
describe("nutrition extras", () => {
  test("limits follow the calories and every text has all languages", () => {
    const items = nutritionExtraGroups.flatMap((group) => group.items);
    const amount = (id: string, calories: number) =>
      extraAmount(
        items.find((item) => item.id === id)!,
        calories,
        (es) => es,
      );
    expect(amount("sugar", 3000)).toBe("Menos de 75 g por día");
    expect(amount("saturatedFat", 2000)).toBe("Menos de 22 g por día");
    expect(amount("transFat", 2000)).toBe("Menos de 2 g por día");
    expect(amount("calcium", 2000)).toBeNull();
    expect(amount("sugar", 0)).toBeNull();
    expect(amount("fiber", 0)).toBe("Al menos 25 g por día");
    const texts = nutritionExtraGroups.flatMap((group) => [
      group.title,
      ...group.items.flatMap((item) => [
        item.name,
        item.benefit,
        item.foods,
        ...(item.amount ? [item.amount] : []),
      ]),
    ]);
    for (const language of ["fr", "zh", "hi", "ar", "de", "it", "pt"])
      for (const [es] of texts)
        // The English fallback only shows up when a translation is missing.
        expect(
          translate(language, es, "missing"),
          `${language}: ${es}`,
        ).not.toBe("missing");
  });
});
