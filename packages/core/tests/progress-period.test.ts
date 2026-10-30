import { expect, test } from "vitest";
import {
  progressRange,
  shiftProgressDate,
  periodSessions,
  progressTotals,
  muscleTotals,
  newRecordCount,
} from "../src/domain/progress-period";
import {
  createDefaultSnapshot,
  readSnapshotJson,
} from "../src/domain/legacy/read-snapshot";
import { bodyMeasurementInputSchema } from "../src/domain/schemas/snapshot";
test("period boundaries use local calendar dates and exclude adjacent sessions", () => {
  const anchor = new Date("2026-10-18T12:00:00");
  expect(progressRange("week", anchor).start.getDate()).toBe(12);
  const quarter = progressRange("quarter", anchor);
  expect(quarter.start.getMonth()).toBe(9);
  expect(quarter.end.getMonth()).toBe(0);
  const s = createDefaultSnapshot();
  s.sessions = [
    { id: "inside", date: "2026-10-18T12:00:00", routine: "r", day: "d" },
    { id: "outside", date: "2026-10-19T12:00:00", routine: "r", day: "d" },
  ];
  expect(
    periodSessions(s, progressRange("week", anchor)).map((x) => x.id),
  ).toEqual(["inside"]);
});
test("totals preserve unknown duration, weight units, grouped sets and stored historical muscle groups", () => {
  const s = createDefaultSnapshot();
  s.sessions = [
    {
      id: "one",
      date: "2026-10-18",
      routine: "r",
      day: "d",
      weightUnit: "lb",
      volume: 220.462,
      exercises: [
        {
          id: "elevaciones-de-cadera-con-barra",
          group: "Piernas",
          performedSets: [
            { reps: 8, kg: 10, dropGroup: "a" },
            { reps: 8, kg: 8, dropGroup: "a" },
          ],
        },
      ],
    },
    {
      id: "two",
      date: "2026-10-18T12:00:00",
      routine: "r",
      day: "d",
      duration: 20,
      groupSets: { Glúteos: 4 },
    },
  ];
  const totals = progressTotals(s);
  expect(totals.days).toBe(1);
  expect(totals.unknown).toBe(1);
  expect(totals.minutes).toBe(20);
  expect(totals.volumeKg).toBeCloseTo(100);
  expect(totals.sets).toBe(1);
  expect(muscleTotals(s).Piernas).toBe(1);
  expect(muscleTotals(s)["Glúteos"]).toBe(4);
});
test("new record count excludes first entries, ties and warmups", () => {
  const s = createDefaultSnapshot();
  s.sessions = [10, 12, 12].map((kg, i) => ({
    id: String(i),
    date: `2026-10-${10 + i}T12:00:00`,
    routine: "r",
    day: "d",
    exercises: [
      {
        id: "sentadilla",
        performedSets: [
          { kg: 200, reps: 10, type: "warmup" },
          { kg, reps: 8, entered: true, done: true },
        ],
      },
    ],
  }));
  expect(newRecordCount(s, s.sessions)).toBe(1);
});
test("body records round trip optional fields and metadata without rewriting account history", () => {
  const s = createDefaultSnapshot();
  s.bodyMeasurements = [
    {
      id: "m",
      date: "2026-10-18",
      weightKg: 70,
      waistCm: 80,
      note: "preserve",
    },
  ];
  const restored = readSnapshotJson(JSON.stringify(s));
  expect(restored.ok).toBe(true);
  if (!restored.ok) throw Error("read failed");
  expect(restored.snapshot.bodyMeasurements).toEqual(s.bodyMeasurements);
  expect(
    bodyMeasurementInputSchema.safeParse({ id: "m", date: "2026-10-18" })
      .success,
  ).toBe(false);
  expect(
    bodyMeasurementInputSchema.safeParse({
      id: "m",
      date: "2026-10-18",
      weightKg: -1,
    }).success,
  ).toBe(false);
  expect(
    bodyMeasurementInputSchema.safeParse({
      id: "m",
      date: "2026-02-30",
      weightKg: 70,
    }).success,
  ).toBe(false);
  expect(
    bodyMeasurementInputSchema.safeParse({
      id: "m",
      date: "2026-10-18",
      waistCm: 80,
    }).success,
  ).toBe(true);
  expect(
    bodyMeasurementInputSchema.safeParse({
      id: "m",
      date: "2026-10-18",
      photo: "https://example.com/private.jpg",
    }).success,
  ).toBe(false);
});

test("custom starts preserve the chosen day and clamp month/year ends", () => {
  const anchor = new Date("2026-10-20T12:00:00");
  for (const [period, day] of [
    ["day", 21],
    ["week", 27],
  ] as const) {
    const r = progressRange(period, anchor, true);
    expect(r.start.getDate()).toBe(20);
    expect(r.end.getDate()).toBe(day);
  }
  expect(progressRange("month", anchor, true).start.getDate()).toBe(20);
  expect(progressRange("month", anchor, true).end.getMonth()).toBe(10);
  expect(progressRange("month", anchor, true).end.getDate()).toBe(20);
  expect(progressRange("year", anchor).start.getMonth()).toBe(0);
  expect(progressRange("day", anchor).start.getDate()).toBe(20);
  expect(shiftProgressDate(new Date(2026, 0, 31), "month", 1).getDate()).toBe(
    28,
  );
  expect(shiftProgressDate(new Date(2024, 1, 29), "year", 1).getDate()).toBe(
    28,
  );
  expect(progressRange("all", anchor, true).start.getDate()).toBe(20);
});
