import { z } from "zod";
import rawPools from "@/data/legacy/automaticPools.json";
import { availableExercises, gluteExerciseIds } from "@/data/exercises";
import { translate } from "@/data/translations";
import {
  muscleGroups,
  muscleGroupSchema,
  type MuscleGroup,
} from "@/domain/schemas/exercise";
import { routineSchema, type Routine } from "@/domain/schemas/snapshot";

const pools = z
  .record(muscleGroupSchema, z.array(z.string()))
  .parse({ ...rawPools, Glúteos: [...gluteExerciseIds] });
const requestSchema = z.strictObject({
  groups: z.array(muscleGroupSchema).min(1),
  days: z.number().int().min(1).max(7),
  goal: z
    .enum([
      "Fuerza e hipertrofia",
      "Ganar masa muscular",
      "Mejorar condición física",
    ])
    .default("Fuerza e hipertrofia"),
});

export function buildAutomaticRoutine(
  raw: unknown,
  options: { makeId: () => string; language: string },
): Routine {
  const request = requestSchema.parse(raw);
  const selected = muscleGroups.filter((group) =>
    request.groups.includes(group),
  );
  let splits: MuscleGroup[][];
  if (request.days === 1) splits = [selected];
  else if (request.days === 2) {
    const lower = selected.filter((group) =>
      ["Piernas", "Glúteos", "Gemelos", "Abdominales"].includes(group),
    );
    const upper = selected.filter((group) => !lower.includes(group));
    splits =
      upper.length && lower.length
        ? [upper, lower]
        : [
            selected.filter((_, index) => index % 2 === 0),
            selected.filter((_, index) => index % 2 === 1),
          ].filter((split) => split.length);
  } else {
    const families: MuscleGroup[][] = [
      ["Pectorales", "Hombros", "Tríceps"],
      ["Espalda", "Bíceps"],
      ["Piernas", "Glúteos", "Gemelos"],
    ];
    splits = families
      .map((family) => family.filter((group) => selected.includes(group)))
      .filter((split) => split.length);
    if (selected.includes("Abdominales")) {
      if (!splits.length) splits = [["Abdominales"]];
      else
        splits
          .reduce((a, b) => (a.length <= b.length ? a : b))
          .push("Abdominales");
    }
    while (splits.length < Math.min(3, request.days, selected.length)) {
      const largest = splits.reduce((a, b) => (a.length >= b.length ? a : b));
      if (largest.length < 2) break;
      splits.push(largest.splice(Math.ceil(largest.length / 2)));
    }
  }
  const availablePools = new Map(
    selected.map((group) => [
      group,
      pools[group]
        .filter((id) =>
          availableExercises.some(
            (exercise) => exercise.id === id && exercise.group === group,
          ),
        )
        .sort((firstId, secondId) => {
          const rank = (id: string) => {
            const exercise = availableExercises.find((item) => item.id === id);
            if (!exercise) return 99;
            const compound = ["push", "pull", "squat", "hinge", "hip"].includes(
              exercise.pattern,
            );
            if (request.goal === "Mejorar condición física")
              return exercise.level === "Inicial" ? 0 : 1;
            if (request.goal === "Ganar masa muscular") return compound ? 0 : 1;
            return compound ? 0 : 1;
          };
          return rank(firstId) - rank(secondId);
        }),
    ]),
  );
  function poolFor(group: MuscleGroup): string[] {
    const pool = availablePools.get(group);
    if (!pool?.length) throw new Error(`No exercises available for ${group}`);
    return pool;
  }
  selected.forEach(poolFor);
  const uses = new Map<MuscleGroup, number>();
  const rid = `r${z.string().min(1).parse(options.makeId())}`;
  const days = Array.from({ length: request.days }, (_, index) => {
    const muscles = splits[index % splits.length];
    if (!muscles?.length) throw new Error("Empty routine split");
    const allocation = new Map(muscles.map((group) => [group, 1]));
    const targetByGoal = {
      "Fuerza e hipertrofia": [4, 5, 6],
      "Ganar masa muscular": [5, 6, 7],
      "Mejorar condición física": [3, 4, 5],
    }[request.goal];
    const target = targetByGoal[Math.min(muscles.length, 3) - 1] ?? 4;
    const limit = Math.max(
      muscles.length,
      Math.min(
        target,
        muscles.reduce((sum, group) => sum + poolFor(group).length, 0),
      ),
    );
    let total = muscles.length;
    while (total < limit) {
      const available = muscles.filter(
        (group) => (allocation.get(group) ?? 0) < poolFor(group).length,
      );
      if (!available.length) break;
      const group = available.reduce((a, b) =>
        (allocation.get(a) ?? 0) <= (allocation.get(b) ?? 0) ? a : b,
      );
      allocation.set(group, (allocation.get(group) ?? 0) + 1);
      total++;
    }
    const items = muscles.flatMap((group) => {
      const pool = poolFor(group),
        used = uses.get(group) ?? 0,
        offset = used % pool.length;
      uses.set(group, used + 1);
      return Array.from({ length: allocation.get(group) ?? 0 }, (_, item) => {
        const id = pool[(offset + item) % pool.length];
        if (!id) throw new Error("Invalid pool index");
        return id;
      });
    });
    return {
      id: `${rid}-d${index + 1}`,
      name: `${translate(options.language, "Día", "Day")} ${index + 1} · ${muscles.join(" + ")}`,
      items,
    };
  });
  return routineSchema.parse({
    id: rid,
    name: `${translate(options.language, "Rutina automática", "Automatic routine")} · ${request.days} ${translate(options.language, "días", "days")}`,
    goal: translate(
      options.language,
      request.goal,
      request.goal === "Fuerza e hipertrofia"
        ? "Strength and hypertrophy"
        : request.goal === "Ganar masa muscular"
          ? "Build muscle"
          : "Improve fitness",
    ),
    days,
  });
}
