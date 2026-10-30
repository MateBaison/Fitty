import type { Snapshot } from "./schemas/snapshot";
import { localDateKey, validDateKey } from "./workouts";
import { progressTotals, periodSessions } from "./progress-period";
export function comparisonRange(start: string, end: string) {
  if (!validDateKey(start) || !validDateKey(end) || start > end) return null;
  const from = new Date(`${start}T00:00:00`),
    until = new Date(`${end}T00:00:00`);
  until.setDate(until.getDate() + 1);
  return { start: from, end: until };
}
export function comparisonDates(range: { start: Date; end: Date }) {
  const end = new Date(range.end);
  end.setDate(end.getDate() - 1);
  return { start: localDateKey(range.start), end: localDateKey(end) };
}
export function compareProgress(
  snapshot: Snapshot,
  first: { start: string; end: string },
  second: { start: string; end: string },
) {
  const a = comparisonRange(first.start, first.end),
    b = comparisonRange(second.start, second.end);
  if (!a || !b) return null;
  return [a, b].map((range) =>
    progressTotals({ ...snapshot, sessions: periodSessions(snapshot, range) }),
  );
}
