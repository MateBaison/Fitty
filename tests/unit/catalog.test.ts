import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  exercises,
  availableExercises,
  exerciseImage,
  imageVariants,
  matchesEquipment,
  muscleImages,
  fullBodyImage,
  gluteExerciseIds,
  normalizeSearch,
} from "../../src/data/exercises";
import { muscleGroups } from "../../src/domain/schemas/exercise";
import retired from "../../src/data/legacy/retired.json";
import legacyExercises from "../../src/data/legacy/exercises.json";

describe("Phase 1 catalog/asset parity", () => {
  test("retains all 136 IDs, nine groups and no retired catalog entries", () => {
    expect(exercises).toHaveLength(139);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(139);
    expect(JSON.stringify(exercises.slice(0, 136))).toBe(
      JSON.stringify(
        legacyExercises.map((exercise) =>
          exercise.id === "elevaciones-de-cadera-acostado-lateralmente"
            ? { ...exercise, group: "Abdominales" }
            : (gluteExerciseIds as readonly string[]).includes(exercise.id)
              ? { ...exercise, group: "Glúteos" }
              : exercise,
        ),
      ),
    );
    expect(new Set(exercises.map((exercise) => exercise.group))).toEqual(
      new Set(muscleGroups),
    );
    expect(exercises.some((exercise) => retired.includes(exercise.id))).toBe(
      false,
    );
  });
  test("every catalog, muscle and variant path exists with valid image bytes", async () => {
    const paths = new Set([
      ...exercises.map((exercise) => exercise.image),
      ...Object.values(muscleImages),
      fullBodyImage,
      ...Object.values(imageVariants).flatMap(Object.values),
    ]);
    for (const path of paths) {
      const bytes = await readFile(`public/assets/${path}`);
      if (path.endsWith(".svg")) expect(bytes.toString()).toContain("<svg");
      else expect(bytes.subarray(0, 2).toString("hex")).toBe("ffd8");
    }
  });
  test("preserves both sex-specific variants and neutral fallback", () => {
    const exercise = exercises.find(
      (item) => item.id === "extension-de-triceps-con-polea-trasnuca",
    );
    if (!exercise) throw new Error("Missing canonical exercise");
    expect(exerciseImage(exercise, "hombre")).toBe(
      "/assets/exercises/additions/extension-de-triceps-con-polea-trasnuca-v2-masculino.jpg",
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      "/assets/exercises/additions/extension-de-triceps-con-polea-trasnuca-v2-femenino.jpg",
    );
    expect(exerciseImage(exercise, "no_decirlo")).toBe(
      `/assets/${exercise.image}`,
    );
    expect(Object.keys(imageVariants)).toHaveLength(133);
  });
  test("static holds use seconds, dynamic planks and presses use reps", () => {
    for (const id of [
      "plancha-lateral",
      "lumbares-superman",
      "lumbares-cruzados",
    ]) {
      const exercise = exercises.find((item) => item.id === id)!;
      expect(exercise.tracking).toBe(
        id === "plancha-lateral" ? "seconds" : "reps",
      );
      expect(exerciseImage(exercise, "hombre")).toContain(
        `${id}${id === "plancha-lateral" ? "-v2" : "-espalda-v2"}-masculino.jpg`,
      );
      expect(exerciseImage(exercise, "mujer")).toContain(
        `${id}${id === "plancha-lateral" ? "-v2" : "-espalda-v2"}-femenino.jpg`,
      );
    }
    expect(
      exercises.find((exercise) => exercise.id === "plancha")?.tracking,
    ).toBe("seconds");
    expect(
      exercises.find((exercise) => exercise.id === "plancha-con-flexion")
        ?.tracking,
    ).toBe("reps");
    expect(
      exercises.find((exercise) => exercise.id === "press-militar")?.tracking,
    ).toBe("reps");
  });
  test("search ignores accents; bar T is included under bar", () => {
    expect(normalizeSearch("  TrÍceps ")).toBe("triceps");
    const row = exercises.find((exercise) => exercise.id === "remo-en-barra-t");
    if (!row) throw new Error("Missing row");
    expect(matchesEquipment(row, "Barra")).toBe(true);
    expect(matchesEquipment(row, "Mancuernas")).toBe(false);
  });
});

test("lateral lying hip raises move to abs without changing their archived ID or images", () => {
  const id = "elevaciones-de-cadera-acostado-lateralmente";
  const current = availableExercises.find((exercise) => exercise.id === id)!;
  const archived = legacyExercises.find((exercise) => exercise.id === id)!;
  expect(archived.group).toBe("Piernas");
  expect(JSON.stringify(current)).toBe(
    JSON.stringify({ ...archived, group: "Abdominales" }),
  );
  expect(exerciseImage(current, "hombre")).toContain(`${id}-masculino.jpg`);
  expect(exerciseImage(current, "mujer")).toContain(`${id}-femenino.jpg`);
});

test("library images follow profile gender without changing historical exercise definitions", () => {
  for (const id of [
    "cruce-de-poleas",
    "press-de-banca-en-maquina-sentado",
    "press-de-banca-declinado-con-barra",
    "flexiones",
    "curl-con-barra",
    "curl-alterno-con-mancuernas",
    "curl-con-barra-ez",
    "curl-de-predicador-con-barra-ez",
    "curl-alterno-de-martillo-con-mancuernas",
    "curl-inclinado-con-mancuernas",
    "curl-concentrado-con-mancuernas",
    "curl-de-cable-en-polea-baja-a-una-mano",
    "curl-de-cable-con-barra-recta-en-polea-baja",
    "curl-de-muneca-con-barra-sentado",
    "curl-de-barra-invertido",
    "fondos-en-barras-paralelas",
    "fondos-en-banco",
    "extension-de-triceps-con-mancuernas-tumbado",
    "press-de-banca-inclinado-con-barra",
    "press-de-banca-con-mancuernas",
    "aperturas-con-mancuernas",
    "aperturas-inclinadas-con-mancuernas",
    "elevaciones-de-cadera-acostado-lateralmente",
    "elevaciones-de-cadera-con-barra",
    "plancha",
    "plancha-con-flexion",
    "extension-de-triceps-en-polea",
    "extension-de-triceps-tumbado",
    "extension-de-triceps-en-polea-con-cuerda",
    "press-de-banca-con-barra",
    "extension-de-triceps-con-polea-trasnuca",
    "crunch",
    "crunch-oblicuo",
    "abdominales-en-maquina",
    "abdominales-con-cuerda-en-polea-alta",
    "elevacion-de-piernas",
    "encogimientos-de-rodillas-para-abdominales",
    "extension-de-triceps-con-mancuernas-por-encima-de-la-cabeza",
    "press-banca-con-agarre-cerrado",
    "patadas-traseras",
    "extension-de-triceps-con-cable-de-agarre-inverso-con-barra",
    "extension-de-triceps-con-cable-a-una-mano",
    "press-frances-sentado-con-barra",
    "press-banca-inclinado-con-mancuernas",
    "aperturas-en-maquina-peck-deck-o-contractora",
  ]) {
    const exercise = exercises.find((item) => item.id === id)!;
    expect(exerciseImage(exercise, "hombre")).toBe(
      `/assets/exercises/additions/${id}${id === "aperturas-inclinadas-con-mancuernas" ? "-v5" : ["press-de-banca-inclinado-con-barra", "press-de-banca-con-mancuernas", "aperturas-con-mancuernas", "aperturas-inclinadas-con-mancuernas"].includes(id) ? "-v3" : ["press-de-banca-declinado-con-barra", "extension-de-triceps-con-polea-trasnuca", "abdominales-con-cuerda-en-polea-alta", "press-banca-con-agarre-cerrado", "extension-de-triceps-con-cable-de-agarre-inverso-con-barra"].includes(id) ? "-v2" : ""}-masculino.jpg`,
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      `/assets/exercises/additions/${id}${id === "aperturas-inclinadas-con-mancuernas" ? "-v5" : ["press-de-banca-inclinado-con-barra", "press-de-banca-con-mancuernas", "aperturas-con-mancuernas", "aperturas-inclinadas-con-mancuernas"].includes(id) ? "-v3" : ["press-de-banca-declinado-con-barra", "extension-de-triceps-con-polea-trasnuca", "abdominales-con-cuerda-en-polea-alta", "press-banca-con-agarre-cerrado", "extension-de-triceps-con-cable-de-agarre-inverso-con-barra"].includes(id) ? "-v2" : ""}-femenino.jpg`,
    );
    expect(exerciseImage(exercise, "otro")).toBe(`/assets/${exercise.image}`);
  }
});

test("available leg exercises resolve both new mannequins while excluded hip exercises retain their images", () => {
  const excluded = [
    "elevaciones-de-cadera-acostado-lateralmente",
    "elevaciones-de-cadera-con-barra",
  ];
  const legs = availableExercises.filter(
    (exercise) =>
      ["Piernas", "Glúteos"].includes(exercise.group) &&
      !excluded.includes(exercise.id),
  );
  expect(legs).toHaveLength(38);
  for (const exercise of legs) {
    const version =
      exercise.id === "sentadilla-frontal"
        ? "v4"
        : exercise.id === "peso-muerto-rumano-con-barra"
          ? "v3"
          : [
                "sentadilla",
                "zancada",
                "extension-a-una-pierna",
                "peso-muerto-rumano-con-mancuernas",
                "sentadilla-goblet-con-mancuerna",
                "salto-rodillas-al-pecho",
                "caminata-lateral-con-minibanda",
                "step-up-con-mancuernas",
                "groiners",
              ].includes(exercise.id)
            ? "v2"
            : "v1";
    expect(exerciseImage(exercise, "hombre")).toBe(
      `/assets/exercises/additions/${exercise.id}-legs-${version}-masculino.jpg`,
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      `/assets/exercises/additions/${exercise.id}-legs-${version}-femenino.jpg`,
    );
    expect(exerciseImage(exercise, "otro")).toBe(`/assets/${exercise.image}`);
  }
  for (const id of excluded) {
    const exercise = exercises.find((item) => item.id === id)!;
    expect(exerciseImage(exercise, "hombre")).toBe(
      `/assets/exercises/additions/${id}-masculino.jpg`,
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      `/assets/exercises/additions/${id}-femenino.jpg`,
    );
  }
});

// The machine illustrations replace only the selected variants; historical IDs and neutral assets stay intact.
test("both calf exercises resolve male and female machine illustrations", () => {
  for (const id of [
    "elevacion-de-gemelos-sentado",
    "elevacion-de-gemelos-de-pie",
  ]) {
    const exercise = exercises.find((item) => item.id === id)!;
    expect(exerciseImage(exercise, "hombre")).toBe(
      `/assets/exercises/additions/${id}-maquina-v2-masculino.jpg`,
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      `/assets/exercises/additions/${id}-maquina-v2-femenino.jpg`,
    );
    expect(exerciseImage(exercise, "otro")).toBe(`/assets/${exercise.image}`);
  }
});
