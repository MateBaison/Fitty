import { expect, test } from "vitest";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import {
  addDropSegment,
  buildSession,
  countSetGroups,
  setNumber,
  metricFor,
  startWorkout,
} from "../src/domain/workouts";
import type { Entry } from "../src/domain/workouts";
import { snapshotSchema } from "../src/domain/schemas/snapshot";
import { recordPanel } from "../src/domain/personal-records";
import { exerciseHistories } from "../src/domain/progress";
import { exercises } from "../src/data/exercises";
const extras = {
  color: "#4b9bff",
  comment: "",
  photos: [],
  bodyWeightStartKg: null,
  bodyWeightEndKg: null,
};
test("drop segments stay one set, preserve types and sum every segment volume", () => {
  const snapshot = createDefaultSnapshot();
  const entry: Entry = {
    id: "press-de-banca-con-barra",
    sets: [{ kg: 40, reps: 10, entered: true, type: "drop" }],
  };
  addDropSegment(entry, 0, "reps");
  expect(entry.sets[1]?.kg).toBe(32);
  expect(entry.sets[1]?.entered).toBe(false);
  const first = buildSession(
    snapshot,
    [entry],
    { routine: "R", day: "D" },
    "2026-10-11T12:00:00Z",
    extras,
  );
  expect(first.sets).toBe(1);
  expect(first.volume).toBe(400);
  Object.assign(entry.sets[1]!, { reps: 8, entered: true });
  addDropSegment(entry, 1, "reps", 25);
  expect(entry.sets[2]?.kg).toBe(24);
  Object.assign(entry.sets[2]!, { reps: 6, entered: true });
  const session = buildSession(
    snapshot,
    [entry],
    { routine: "R", day: "D" },
    "2026-10-11T12:00:00Z",
    extras,
  );
  expect(session.sets).toBe(1);
  expect(session.volume).toBe(800);
  expect(session.exercises?.[0]?.performedSets).toHaveLength(3);
  expect(countSetGroups(session.exercises![0]!.performedSets!)).toBe(1);
  snapshot.sessions.push(session);
  expect(
    snapshotSchema.parse(snapshot).sessions[0]?.exercises?.[0]
      ?.performedSets?.[2]?.dropGroup,
  ).toBe(entry.sets[0]?.dropGroup);
});
test("catalog defaults audited, chosen metric survives reload and next workout without altering old values", () => {
  const snapshot = createDefaultSnapshot();
  expect(exercises).toHaveLength(139);
  expect(
    exercises
      .filter((e) => e.tracking === "seconds")
      .map((e) => e.id)
      .sort(),
  ).toEqual(
    [
      "plancha",
      "plancha-lateral",
      "sentadilla-isometrica-apoyado-sobre-la-pared",
    ].sort(),
  );
  for (const exercise of exercises)
    expect(metricFor(snapshot, exercise.id)).toBe(exercise.tracking);
  snapshot.settings.exerciseMetrics = { "press-de-banca-con-barra": "seconds" };
  const restored = snapshotSchema.parse(snapshot);
  startWorkout(restored, "r1", "d1");
  expect(
    metricFor(
      restored,
      "press-de-banca-con-barra",
      restored.workout!.entries[0],
    ),
  ).toBe("seconds");
  expect(restored.workout!.entries[0]?.sets[0]?.seconds).toBeNull();
  expect(
    metricFor(restored, "press-de-banca-con-barra", {
      id: "press-de-banca-con-barra",
      tracking: "reps",
      sets: [],
    }),
  ).toBe("reps");
});
test("record panel separates metrics, converts units, excludes warmup and opens the source session", () => {
  const snapshot = createDefaultSnapshot();
  snapshot.sessions = [
    {
      id: "a",
      routine: "R",
      day: "D",
      date: "2026-10-01",
      weightUnit: "kg",
      exercises: [
        {
          id: "plancha",
          performedSets: [
            { kg: 0, seconds: 60 },
            { kg: 0, reps: 20 },
            { kg: 200, reps: 1, type: "warmup" },
          ],
        },
      ],
    },
    {
      id: "b",
      routine: "R",
      day: "D",
      date: "2026-10-02",
      weightUnit: "lb",
      exercises: [{ id: "plancha", performedSets: [{ kg: 0, seconds: 70 }] }],
    },
  ];
  const panel = recordPanel(snapshot);
  expect(panel.find((r) => r.kind === "seconds")?.sessionId).toBe("b");
  expect(panel.find((r) => r.kind === "reps")?.quantity).toBe(20);
  expect(panel.some((r) => r.weight === 200)).toBe(false);
  expect(
    exerciseHistories(snapshot, false).get("plancha")?.[0]?.sets,
  ).toHaveLength(2);
  expect(metricFor(snapshot, "plancha")).toBe("seconds");
});

test("pyramid segments rise then fall, retain their type and count as one set", () => {
  const entry: Entry = {
    id: "press-de-banca-con-barra",
    sets: [{ kg: 20, reps: 10, type: "pyramid", entered: true }],
  };
  addDropSegment(entry, 0, "reps", -25);
  addDropSegment(entry, 1, "reps", 20);
  expect(entry.sets.map((set) => set.kg)).toEqual([20, 25, 20]);
  expect(entry.sets.every((set) => set.type === "pyramid")).toBe(true);
  expect(entry.sets[1]?.entered).toBe(false);
  expect(countSetGroups(entry.sets)).toBe(1);
  expect(entry.sets.map((_, index) => setNumber(entry.sets, index))).toEqual([
    "1.1",
    "1.2",
    "1.3",
  ]);
  const session = buildSession(
    createDefaultSnapshot(),
    [entry],
    { routine: "R", day: "D" },
    "2026-10-11T12:00:00Z",
    extras,
  );
  expect(session.exercises?.[0]?.performedSets?.[0]?.type).toBe("pyramid");
});
