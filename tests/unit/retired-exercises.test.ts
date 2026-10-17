import { expect, test } from "bun:test";
import { createDefaultSnapshot } from "../../src/domain/legacy/read-snapshot";
import {
  catalogFor,
  findExercise,
  startWorkout,
  buildSession,
} from "../../src/domain/workouts";
import { weeklyData } from "../../src/domain/progress";
import { buildAutomaticRoutine } from "../../src/domain/calculations/automatic-routine";

const retiredId = "abdominales-con-brazos-estirados";

test("seven retired leg choices stay readable in saved workouts and history", () => {
  const ids = [
    "sentadillas-con-propio-peso",
    "sentadillas-con-balon-medicinal",
    "peso-muerto-con-balon-medicinal",
    "sentadilla-con-minibanda",
    "puente-con-bandas",
    "elevaciones-de-cadera-con-maquina-smith",
    "elevaciones-cortas-en-posicion-de-rana-con-maquina-smith",
  ];
  const snapshot = createDefaultSnapshot();
  const selectableIds = catalogFor(snapshot).map((exercise) => exercise.id);
  for (const id of ids) {
    expect(selectableIds).not.toContain(id);
    expect(findExercise(snapshot, id)?.group).toBe("Piernas");
  }
  expect(selectableIds).toContain("sentadilla");
  expect(selectableIds).toContain("sentadilla-frontal");
  const routine = snapshot.routines[0]!;
  const day = routine.days[0]!;
  day.items = [...ids];
  startWorkout(snapshot, routine.id, day.id);
  expect(snapshot.workout!.entries.map((entry) => entry.id)).toEqual(ids);
  for (const entry of snapshot.workout!.entries) {
    entry.sets[0] = { kg: 10, reps: 12, entered: true, done: true };
  }
  const session = buildSession(
    snapshot,
    snapshot.workout!.entries,
    { routine: routine.name, day: day.name },
    "2026-10-17T12:00:00",
    {
      color: "#4b9bff",
      comment: "",
      photos: [],
      bodyWeightStartKg: null,
      bodyWeightEndKg: null,
    },
  );
  expect(session.exercises?.map((exercise) => exercise.id)).toEqual(ids);
  snapshot.sessions = [
    {
      ...session,
      groupSets: undefined,
      exercises: ids.map((id) => ({ id, sets: 3 })),
    },
  ];
  expect(
    weeklyData(snapshot, 1, new Date("2026-10-17T12:00:00"))[0]?.groups.Piernas,
  ).toBe(21);
  expect(day.items).toEqual(ids);
  for (let days = 1; days <= 7; days++) {
    const generated = buildAutomaticRoutine(
      { groups: ["Piernas"], days },
      { makeId: () => "legs-retired", language: "es" },
    );
    const generatedIds = generated.days.flatMap((day) => day.items);
    expect(generatedIds.length).toBeGreaterThan(0);
    for (const id of ids) expect(generatedIds).not.toContain(id);
  }
});

test("decline dumbbell press is retired without breaking saved workouts", () => {
  const id = "press-de-banca-declinado-con-mancuernas";
  const snapshot = createDefaultSnapshot();
  expect(catalogFor(snapshot).some((exercise) => exercise.id === id)).toBe(
    false,
  );
  expect(findExercise(snapshot, id)?.name).toBe(
    "Press de banca declinado con mancuernas",
  );
  const routine = snapshot.routines[0]!;
  const day = routine.days[0]!;
  day.items = [id];
  startWorkout(snapshot, routine.id, day.id);
  expect(snapshot.workout!.entries[0]!.id).toBe(id);
  for (let days = 1; days <= 7; days++) {
    const generated = buildAutomaticRoutine(
      { groups: ["Pectorales"], days },
      { makeId: () => "decline-retired", language: "es" },
    );
    expect(generated.days.flatMap((day) => day.items)).not.toContain(id);
  }
});

test("retired shoulder choices remain available to saved workouts only", () => {
  const ids = [
    "press-militar-con-mancuernas",
    "cruces-inversos-en-polea-alta",
    "elevaciones-frontales-con-barra",
    "elevacion-frontal-con-mancuernas-alternas-agarre-neutro",
  ];
  const snapshot = createDefaultSnapshot();
  for (const id of ids) {
    expect(catalogFor(snapshot).some((exercise) => exercise.id === id)).toBe(
      false,
    );
    expect(findExercise(snapshot, id)?.group).toBe("Hombros");
    const routine = snapshot.routines[0]!;
    const day = routine.days[0]!;
    day.items = [id];
    snapshot.workout = null;
    startWorkout(snapshot, routine.id, day.id);
    expect(snapshot.workout!.entries[0]!.id).toBe(id);
  }
  for (let days = 1; days <= 7; days++) {
    const routine = buildAutomaticRoutine(
      { groups: ["Hombros"], days },
      { makeId: () => "shoulder-retired", language: "es" },
    );
    for (const id of ids)
      expect(routine.days.flatMap((day) => day.items)).not.toContain(id);
  }
});

test("retired library choice remains usable in saved routines and history", () => {
  const snapshot = createDefaultSnapshot();
  expect(
    catalogFor(snapshot).some((exercise) => exercise.id === retiredId),
  ).toBe(false);
  expect(findExercise(snapshot, retiredId)?.name).toBe(
    "Abdominales con brazos estirados",
  );
  const routine = snapshot.routines[0]!;
  const day = routine.days[0]!;
  day.items = [retiredId];
  startWorkout(snapshot, routine.id, day.id);
  snapshot.workout!.entries[0]!.sets[0] = {
    kg: 0,
    reps: 12,
    entered: true,
    done: true,
  };
  const session = buildSession(
    snapshot,
    snapshot.workout!.entries,
    { routine: routine.name, day: day.name },
    "2026-10-13T12:00:00",
    {
      color: "#4b9bff",
      comment: "",
      photos: [],
      bodyWeightStartKg: null,
      bodyWeightEndKg: null,
    },
  );
  expect(session.exercises?.[0]?.id).toBe(retiredId);
  // Historical rows lacking a saved muscle group still resolve their catalog definition.
  snapshot.sessions = [
    {
      ...session,
      date: "2026-10-13T12:00:00",
      groupSets: undefined,
      exercises: [{ id: retiredId, sets: 3 }],
    },
  ];
  expect(
    weeklyData(snapshot, 1, new Date("2026-10-13T12:00:00"))[0]?.groups
      .Abdominales,
  ).toBe(3);
  expect(day.items).toEqual([retiredId]);
});

test("new automatic routines never select retired exercises", () => {
  for (let days = 1; days <= 7; days++) {
    const routine = buildAutomaticRoutine(
      { groups: ["Abdominales"], days },
      { makeId: () => "retired-test", language: "es" },
    );
    expect(routine.days.flatMap((day) => day.items)).not.toContain(retiredId);
  }
});

test("single-arm supinated triceps is hidden but its historical definition remains", () => {
  const snapshot = createDefaultSnapshot();
  const id = "extension-de-triceps-con-cable-a-una-mano-con-agarre-supinado";
  expect(catalogFor(snapshot).some((exercise) => exercise.id === id)).toBe(
    false,
  );
  expect(findExercise(snapshot, id)?.group).toBe("Tríceps");
  expect(
    findExercise(snapshot, "extension-de-triceps-con-cable-a-una-mano"),
  ).toBeDefined();
  for (let days = 1; days <= 7; days++) {
    const routine = buildAutomaticRoutine(
      { groups: ["Tríceps"], days },
      { makeId: () => "triceps-retired", language: "es" },
    );
    expect(routine.days.flatMap((day) => day.items)).not.toContain(id);
  }
});
