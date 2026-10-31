import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import rawPools from "@fitty/core/data/legacy/automaticPools.json";
import { availableExercises } from "@fitty/core/data/exercises";
import { muscleGroups } from "@fitty/core/domain/schemas/exercise";
import { buildAutomaticRoutine } from "@fitty/core/domain/calculations/automatic-routine";
import { routineSchema } from "@fitty/core/domain/schemas/snapshot";

test("typed generator keeps the legacy split, naming and sizes for all 1,785 combinations", async () => {
  const html = await readFile("migration-baseline/published.html", "utf8");
  const start = html.indexOf(
    "function buildAutomaticRoutine(groups,dayCount){",
  );
  const end = html.indexOf("function cryptoRoutineId()", start);
  if (start < 0 || end < 0)
    throw new Error("Legacy generator boundaries changed");
  const source = html.slice(start, end);
  // Compare algorithms against the same currently selectable catalog.
  const catalog = new Map(
    availableExercises.map((exercise) => [exercise.id, exercise]),
  );
  const originalGroups = muscleGroups.filter((group) => group !== "Glúteos");
  for (let mask = 1; mask < 256; mask++) {
    const groups = originalGroups.filter(
      (_, index) => (mask & (1 << index)) !== 0,
    );
    for (let days = 1; days <= 7; days++) {
      const legacy: unknown = runInNewContext(
        `${source}\nJSON.stringify(buildAutomaticRoutine(input.groups,input.days))`,
        {
          input: { groups, days },
          GROUPS: Object.fromEntries(
            originalGroups.map((group) => [group, []]),
          ),
          AUTO_ROUTINE_EXERCISES: rawPools,
          byId: (id: string) => catalog.get(id),
          cryptoRoutineId: () => "test",
          txt: (spanish: string) => spanish,
        },
        { timeout: 1000 },
      );
      if (typeof legacy !== "string") throw new Error("Invalid legacy result");
      const modern = buildAutomaticRoutine(
        { groups, days },
        { makeId: () => "test", language: "es" },
      );
      const expected = routineSchema.parse(JSON.parse(legacy) as unknown);
      // Exercise order within a pool is now shaped by the training goal (compound lifts first),
      // so compare the structure that must stay stable: days, names and exercise counts.
      expect({
        ...modern,
        days: modern.days.map((day) => ({ ...day, items: day.items.length })),
      }).toEqual({
        ...expected,
        days: expected.days.map((day) => ({ ...day, items: day.items.length })),
      });
      for (const day of modern.days)
        for (const id of day.items) expect(catalog.has(id)).toBe(true);
    }
  }
});
