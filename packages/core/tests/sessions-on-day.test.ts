import { describe, expect, test } from "vitest";
import { sessionsOnDay } from "../src/domain/workouts";

describe("sessionsOnDay", () => {
  test("orders a day's sessions earliest first, ignoring other days", () => {
    const list = [
      { id: "c", date: "2026-10-30T18:00:00" },
      { id: "x", date: "2026-10-29T09:00:00" },
      { id: "b", date: "2026-10-30T12:00:00" },
      { id: "a", date: "2026-10-30T07:30:00" },
    ];
    expect(sessionsOnDay(list, "2026-10-30").map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("equal times keep registration order from a newest-first list", () => {
    const list = [
      { id: "second", date: "2026-10-30T12:00:00" },
      { id: "first", date: "2026-10-30T12:00:00" },
    ];
    expect(sessionsOnDay(list, "2026-10-30").map((s) => s.id)).toEqual([
      "first",
      "second",
    ]);
  });
});
