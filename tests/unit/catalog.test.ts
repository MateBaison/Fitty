import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  exercises,
  exerciseImage,
  imageVariants,
  matchesEquipment,
  muscleImages,
  normalizeSearch,
} from "../../src/data/exercises";
import { muscleGroups } from "../../src/domain/schemas/exercise";
import retired from "../../src/data/legacy/retired.json";
import legacyExercises from "../../src/data/legacy/exercises.json";

describe("Phase 1 catalog/asset parity", () => {
  test("retains all 136 IDs, eight groups and no retired catalog entries", () => {
    expect(exercises).toHaveLength(139);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(139);
    expect(JSON.stringify(exercises.slice(0, 136))).toBe(
      JSON.stringify(legacyExercises),
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
    expect(Object.keys(imageVariants)).toHaveLength(62);
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
        `${id}${id === "plancha-lateral" ? "-v2" : ""}-masculino.jpg`,
      );
      expect(exerciseImage(exercise, "mujer")).toContain(
        `${id}${id === "plancha-lateral" ? "-v2" : ""}-femenino.jpg`,
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

test("library images follow profile gender without changing historical exercise definitions", () => {
  for (const id of [
    "cruce-de-poleas",
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
    "elevacion-de-gemelos-sentado",
    "elevacion-de-gemelos-de-pie",
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
      `/assets/exercises/additions/${id}${["press-de-banca-inclinado-con-barra", "press-de-banca-con-mancuernas", "aperturas-con-mancuernas", "aperturas-inclinadas-con-mancuernas"].includes(id) ? "-v3" : ["extension-de-triceps-con-polea-trasnuca", "abdominales-con-cuerda-en-polea-alta", "press-banca-con-agarre-cerrado", "extension-de-triceps-con-cable-de-agarre-inverso-con-barra"].includes(id) ? "-v2" : ""}-masculino.jpg`,
    );
    expect(exerciseImage(exercise, "mujer")).toBe(
      `/assets/exercises/additions/${id}${["press-de-banca-inclinado-con-barra", "press-de-banca-con-mancuernas", "aperturas-con-mancuernas", "aperturas-inclinadas-con-mancuernas"].includes(id) ? "-v3" : ["extension-de-triceps-con-polea-trasnuca", "abdominales-con-cuerda-en-polea-alta", "press-banca-con-agarre-cerrado", "extension-de-triceps-con-cable-de-agarre-inverso-con-barra"].includes(id) ? "-v2" : ""}-femenino.jpg`,
    );
    expect(exerciseImage(exercise, "otro")).toBe(`/assets/${exercise.image}`);
  }
});

test("bodyweight squats use new mannequins and standard squats keep their original images", () => {
  const bodyweight = exercises.find(
    (item) => item.id === "sentadillas-con-propio-peso",
  )!;
  expect(exerciseImage(bodyweight, "hombre")).toBe(
    "/assets/exercises/additions/sentadilla-masculino.jpg",
  );
  expect(exerciseImage(bodyweight, "mujer")).toBe(
    "/assets/exercises/additions/sentadilla-femenino.jpg",
  );
  const squat = exercises.find((item) => item.id === "sentadilla")!;
  expect(imageVariants.sentadilla).toBeUndefined();
  expect(exerciseImage(squat, "hombre")).toBe(`/assets/${squat.image}`);
  expect(exerciseImage(squat, "mujer")).toBe(`/assets/${squat.image}`);
});
