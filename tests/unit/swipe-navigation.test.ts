import { expect, test } from "bun:test";
import { swipeDirection } from "../../src/lib/browser/use-swipe-navigation";
test("swipes distinguish previous and next without treating vertical scroll or tiny movements as navigation", () => {
  expect(swipeDirection(100, 10, 300)).toBe("previous");
  expect(swipeDirection(-100, 10, 300)).toBe("next");
  expect(swipeDirection(100, 90, 300)).toBeNull();
  expect(swipeDirection(30, 0, 300)).toBeNull();
  expect(swipeDirection(100, 0, 2000)).toBeNull();
});
