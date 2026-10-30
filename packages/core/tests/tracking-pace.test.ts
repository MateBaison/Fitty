import { expect, test } from "vitest";
import { gpsReading, type GPSFix } from "../src/domain/tracking";
const fix = (
  meters: number,
  time: number,
  speed: number | null = null,
  accuracy = 5,
): GPSFix => ({ lat: 0, lon: meters / 111195, time, speed, accuracy });
test("stationary GPS drift does not inflate distance or speed", () => {
  let state = gpsReading(null, fix(0, 1000), "run", 1000)!.reading;
  let distance = 0;
  for (let index = 2; index <= 20; index++) {
    const next = gpsReading(
      state,
      fix(index % 2 ? 1 : -1, index * 1000),
      "run",
      index * 1000,
    )!;
    state = next.reading;
    distance += next.distance;
  }
  expect(distance).toBe(0);
  expect(state.speed).toBe(0);
});
test("live speed follows slowing within seconds and stops immediately", () => {
  let state = gpsReading(null, fix(0, 1000, 4), "run", 1000)!.reading;
  for (let i = 2; i <= 6; i++)
    state = gpsReading(
      state,
      fix((i - 1) * 2, i * 1000, 2),
      "run",
      i * 1000,
    )!.reading;
  expect(state.speed).toBeLessThan(2.2);
  const stopped = gpsReading(state, fix(10.5, 7000, 0), "run", 7000)!;
  expect(stopped.reading.speed).toBe(0);
  expect(stopped.distance).toBe(0);
});
test("rejects inaccurate, stale, duplicate and implausible GPS samples", () => {
  const state = gpsReading(null, fix(0, 1000, 2), "run", 1000)!.reading;
  expect(gpsReading(state, fix(200, 2000, 2), "run", 2000)).toBeNull();
  expect(gpsReading(state, fix(2, 2000, 60), "run", 2000)).toBeNull();
  expect(gpsReading(state, fix(2, 2000, 2, 100), "run", 2000)).toBeNull();
  expect(gpsReading(state, fix(2, 1000, 2), "run", 2000)).toBeNull();
  expect(gpsReading(state, fix(2, 2000, 2), "run", 20000)).toBeNull();
  const recovered = gpsReading(state, fix(100, 20000, 2), "run", 20000)!;
  expect(recovered.distance).toBe(0);
  expect(recovered.reading.speed).toBe(2);
});
test("fallback estimates recent motion when native speed is unavailable", () => {
  let state = gpsReading(null, fix(0, 1000, null, 3), "run", 1000)!.reading;
  for (let i = 2; i <= 6; i++)
    state = gpsReading(
      state,
      fix((i - 1) * 4, i * 1000, null, 3),
      "run",
      i * 1000,
    )!.reading;
  expect(state.speed).toBeGreaterThan(1.5);
  expect(state.speed).toBeLessThan(4);
});
