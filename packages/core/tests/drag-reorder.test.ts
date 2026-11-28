import { describe, expect, it } from "vitest";
import {
  dropTarget,
  edgeScroll,
  placeList,
  slotShift,
  stackRows,
} from "../src/domain/drag-reorder";

// The second row is taller, like a superset.
const heights = [50, 100, 50, 50];

describe("drag reorder geometry", () => {
  it("stacks rows with a gap", () => {
    expect(stackRows(heights, 10)).toEqual({
      tops: [0, 60, 170, 230],
      height: 280,
    });
    expect(stackRows([], 10)).toEqual({ tops: [], height: 0 });
  });

  it("moves to the next slot past half of the neighbor", () => {
    expect(dropTarget(heights, 10, 0, 54)).toBe(0);
    expect(dropTarget(heights, 10, 0, 55)).toBe(1);
    expect(dropTarget(heights, 10, 0, 999)).toBe(3);
    expect(dropTarget(heights, 10, 3, -29)).toBe(3);
    expect(dropTarget(heights, 10, 3, -30)).toBe(2);
    expect(dropTarget(heights, 10, 3, -999)).toBe(0);
    expect(dropTarget(heights, 10, 1, 0)).toBe(1);
  });

  it("slides the rows in between to make room", () => {
    const shifts = (from: number, to: number) =>
      heights.map((_, index) => slotShift(heights, 10, from, to, index));
    expect(shifts(0, 2)).toEqual([170, -60, -60, 0]);
    expect(shifts(3, 1)).toEqual([0, 60, 60, -170]);
    expect(shifts(1, 1)).toEqual([0, 0, 0, 0]);
  });

  it("keeps the held row under the pointer while the list fits", () => {
    // Row 2 spans 170 to 220, so its middle sits 195 below the start.
    expect(placeList(heights, 10, 2, 400, 20, 700)).toEqual({
      start: 205,
      scroll: 0,
      max: 0,
    });
    expect(placeList(heights, 10, 2, 40, 20, 700).start).toBe(20);
    expect(placeList(heights, 10, 2, 690, 20, 700).start).toBe(420);
  });

  it("scrolls a list taller than the room", () => {
    expect(placeList(heights, 10, 0, 150, 20, 220)).toEqual({
      start: 20,
      scroll: 0,
      max: 80,
    });
    expect(placeList(heights, 10, 3, 200, 20, 220)).toEqual({
      start: 20,
      scroll: 75,
      max: 80,
    });
  });

  it("scrolls only near the edges", () => {
    expect(edgeScroll(50, 0, 600)).toBeLessThan(0);
    expect(edgeScroll(300, 0, 600)).toBe(0);
    expect(edgeScroll(560, 0, 600)).toBeGreaterThan(0);
  });
});
