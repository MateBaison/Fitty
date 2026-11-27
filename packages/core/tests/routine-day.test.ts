import { describe, expect, it } from "vitest";
import {
  removeRoutineExercise,
  replaceRoutineExercise,
} from "../src/domain/routine-day";

const day = (items: string[], supersets?: string[][]) => ({
  id: "day",
  name: "Day",
  items,
  supersets,
});

describe("routine day exercises", () => {
  it("removes an exercise and dissolves a superset left with one", () => {
    const target = day(["a", "b", "c"], [["a", "b"]]);
    removeRoutineExercise(target, 1);
    expect(target.items).toEqual(["a", "c"]);
    expect(target.supersets).toEqual([]);
  });

  it("keeps the superset while a repeated exercise is still in the day", () => {
    const target = day(["a", "b", "a"], [["a", "b"]]);
    removeRoutineExercise(target, 0);
    expect(target.supersets).toEqual([["a", "b"]]);
  });

  it("changes an exercise in place and hands over its superset", () => {
    const target = day(["a", "b", "c"], [["a", "b"]]);
    replaceRoutineExercise(target, 1, "x");
    expect(target.items).toEqual(["a", "x", "c"]);
    expect(target.supersets).toEqual([["a", "x"]]);
  });

  it("never puts an exercise in a superset twice", () => {
    const target = day(
      ["a", "b", "c", "d"],
      [
        ["a", "b"],
        ["c", "d"],
      ],
    );
    replaceRoutineExercise(target, 1, "c");
    expect(target.supersets).toEqual([["c", "d"]]);
    const same = day(["a", "b"], [["a", "b"]]);
    replaceRoutineExercise(same, 1, "a");
    expect(same.supersets).toEqual([]);
  });
});
