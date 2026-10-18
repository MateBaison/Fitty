import { expect, test } from "bun:test";
import {
  comparisonRange,
  comparisonDates,
  compareProgress,
} from "../../src/domain/progress-comparison";
import { createDefaultSnapshot } from "../../src/domain/legacy/read-snapshot";
test("comparison ranges include the final local day and reject invalid or reversed dates", () => {
  const range = comparisonRange("2026-03-28", "2026-03-30")!;
  expect(comparisonDates(range)).toEqual({
    start: "2026-03-28",
    end: "2026-03-30",
  });
  expect(range.end.getDate()).toBe(31);
  expect(comparisonRange("2026-02-30", "2026-03-01")).toBeNull();
  expect(comparisonRange("2026-03-02", "2026-03-01")).toBeNull();
});
test("comparison scopes dates independently, retains unknown duration and normalizes pounds", () => {
  const s = createDefaultSnapshot();
  s.sessions = [
    {
      id: "a",
      routine: "R",
      day: "D",
      date: new Date(2026, 0, 31, 23, 59).toISOString(),
      duration: null,
      sets: 2,
      volume: 220.462,
      weightUnit: "lb",
    },
    {
      id: "b",
      routine: "R",
      day: "D",
      date: new Date(2026, 1, 1, 0, 0).toISOString(),
      duration: 30,
      sets: 3,
      volume: 150,
      weightUnit: "kg",
    },
  ];
  const result = compareProgress(
    s,
    { start: "2026-01-01", end: "2026-01-31" },
    { start: "2026-02-01", end: "2026-02-28" },
  )!;
  expect(result[0]?.sessions).toBe(1);
  expect(result[0]?.unknown).toBe(1);
  expect(result[0]?.volumeKg).toBeCloseTo(100);
  expect(result[1]?.volumeKg).toBeCloseTo(150);
  expect(result[1]?.minutes).toBe(30);
  expect(result[1]?.sets).toBe(3);
  expect(s.sessions).toHaveLength(2);
});
