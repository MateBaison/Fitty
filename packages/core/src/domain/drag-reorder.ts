/**
 * Geometry of a vertical list reordered by dragging one row, shared by the web
 * and the app. All values are screen pixels along the vertical axis.
 */

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Where each row starts when stacked with a gap, and the height of the list. */
export function stackRows(heights: readonly number[], gap: number) {
  let next = 0;
  const tops = heights.map((height) => {
    const top = next;
    next += height + gap;
    return top;
  });
  return { tops, height: Math.max(0, next - gap) };
}

/** Slot the dragged row drops into after moving `dy` away from its own. */
export function dropTarget(
  heights: readonly number[],
  gap: number,
  from: number,
  dy: number,
) {
  // Only ever walk the way the row moved: past a tall row the remainder turns
  // negative, which must not send the row back.
  const direction = dy > 0 ? 1 : -1;
  let target = from;
  let remaining = Math.abs(dy);
  while (heights[target + direction] !== undefined) {
    const step = heights[target + direction]! + gap;
    if (remaining < step / 2) break;
    remaining -= step;
    target += direction;
  }
  return target;
}

/**
 * How far a row sits from its own slot while `from` is headed to `to`: the
 * dragged row gets the distance to the new slot, the others make room.
 */
export function slotShift(
  heights: readonly number[],
  gap: number,
  from: number,
  to: number,
  index: number,
) {
  if (index === from) {
    const passed =
      to > from ? heights.slice(from + 1, to + 1) : heights.slice(to, from);
    const distance = passed.reduce((sum, height) => sum + height + gap, 0);
    return to < from ? -distance : distance;
  }
  const step = (heights[from] ?? 0) + gap;
  if (from < index && index <= to) return -step;
  if (to <= index && index < from) return step;
  return 0;
}

/**
 * Places a list between `top` and `bottom` with the held row as close to the
 * pointer as it fits. A list taller than that room starts at `top` and scrolls.
 */
export function placeList(
  heights: readonly number[],
  gap: number,
  held: number,
  pointer: number,
  top: number,
  bottom: number,
) {
  const { tops, height } = stackRows(heights, gap);
  const wanted = pointer - (tops[held] ?? 0) - (heights[held] ?? 0) / 2;
  if (height <= bottom - top)
    return { start: clamp(wanted, top, bottom - height), scroll: 0, max: 0 };
  const max = height - (bottom - top);
  return { start: top, scroll: clamp(top - wanted, 0, max), max };
}

/** Pixels per frame to scroll while the pointer rests near an edge. */
export function edgeScroll(
  pointer: number,
  top: number,
  bottom: number,
  zone = 72,
  speed = 9,
) {
  if (pointer < top + zone) return -speed;
  if (pointer > bottom - zone) return speed;
  return 0;
}
