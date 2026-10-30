import {
  trackingSessionSchema,
  type TrackingSession,
} from "./schemas/snapshot";
export type Point = { lat: number; lon: number; time: number; speed: number };
export type GPSFix = Omit<Point, "speed"> & {
  speed: number | null;
  accuracy: number;
};
export type GPSReading = { fix: GPSFix; anchor: GPSFix; speed: number };

// Transient quality filtering; historical routes are never recalculated.
export function gpsReading(
  previous: GPSReading | null,
  fix: GPSFix,
  mode: "run" | "cycle",
  now: number,
): { reading: GPSReading; distance: number } | null {
  const maximumSpeed = mode === "run" ? 12 : 35;
  if (
    ![fix.lat, fix.lon, fix.time, fix.accuracy].every(Number.isFinite) ||
    Math.abs(fix.lat) > 90 ||
    Math.abs(fix.lon) > 180 ||
    fix.accuracy <= 0 ||
    fix.accuracy > 40 ||
    now - fix.time > 10000 ||
    fix.time > now + 1000
  )
    return null;
  const nativeSpeed =
    fix.speed != null &&
    Number.isFinite(fix.speed) &&
    fix.speed >= 0 &&
    fix.speed <= maximumSpeed
      ? fix.speed
      : null;
  if (
    fix.speed != null &&
    Number.isFinite(fix.speed) &&
    fix.speed > maximumSpeed
  )
    return null;
  if (!previous)
    return {
      reading: { fix, anchor: fix, speed: nativeSpeed ?? 0 },
      distance: 0,
    };
  const seconds = (fix.time - previous.fix.time) / 1000;
  if (seconds <= 0) return null;
  if (seconds > 15)
    return {
      reading: { fix, anchor: fix, speed: nativeSpeed ?? 0 },
      distance: 0,
    };
  const movement = haversine(
    { ...previous.fix, speed: 0 },
    { ...fix, speed: 0 },
  );
  if (
    movement >
    maximumSpeed * seconds + Math.max(fix.accuracy, previous.fix.accuracy)
  )
    return null;
  const anchorSeconds = (fix.time - previous.anchor.time) / 1000;
  const displacement = haversine(
    { ...previous.anchor, speed: 0 },
    { ...fix, speed: 0 },
  );
  const noise = Math.max(3, (fix.accuracy + previous.anchor.accuracy) / 2);
  const moving =
    nativeSpeed != null ? nativeSpeed >= 0.5 : displacement > noise;
  const distance =
    moving &&
    displacement > (nativeSpeed != null ? 2 : noise) &&
    displacement / anchorSeconds <= maximumSpeed
      ? displacement
      : 0;
  const estimate =
    nativeSpeed ??
    (moving ? Math.max(0, displacement - noise / 2) / anchorSeconds : 0);
  if (estimate > maximumSpeed) return null;
  const speed =
    estimate < 0.5
      ? 0
      : previous.speed +
        (estimate - previous.speed) * (seconds / (seconds + 1.5));
  return {
    reading: {
      fix,
      anchor:
        distance > 0 ||
        (!moving && (nativeSpeed != null || anchorSeconds >= 15))
          ? fix
          : previous.anchor,
      speed,
    },
    distance,
  };
}
// Keep the endpoints and chronological order while bounding full-snapshot GPS payloads.
export function compactRoute(points: Point[], limit = 10000): Point[] {
  if (points.length <= limit) return points.map((point) => ({ ...point }));
  return Array.from({ length: limit }, (_, index) => ({
    ...points[Math.round((index * (points.length - 1)) / (limit - 1))]!,
  }));
}
export function recordedRoute(
  track: {
    mode: "run" | "cycle";
    started: number;
    distance: number;
    points: Point[];
  },
  finished: number,
): TrackingSession {
  if (track.points.length < 2 || finished <= track.started)
    throw new Error("Incomplete GPS route");
  return trackingSessionSchema.parse({
    id: crypto.randomUUID(),
    date: new Date(track.started).toISOString(),
    mode: track.mode,
    durationSeconds: Math.floor((finished - track.started) / 1000),
    distanceMeters: track.distance,
    points: compactRoute(track.points),
  });
}
export function haversine(a: Point, b: Point): number {
  const radians = (value: number) => (value * Math.PI) / 180,
    latitude = radians(b.lat - a.lat),
    longitude = radians(b.lon - a.lon),
    term =
      Math.sin(latitude / 2) ** 2 +
      Math.cos(radians(a.lat)) *
        Math.cos(radians(b.lat)) *
        Math.sin(longitude / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, term)));
}
export function routePoints(points: Point[]): string {
  if (points.length < 2) return "";
  const latitudes = points.map((point) => point.lat),
    longitudes = points.map((point) => point.lon),
    lowLat = Math.min(...latitudes),
    highLat = Math.max(...latitudes),
    lowLon = Math.min(...longitudes),
    highLon = Math.max(...longitudes);
  return points
    .map(
      (point) =>
        `${20 + ((point.lon - lowLon) / (highLon - lowLon || 0.00001)) * 280},${190 - ((point.lat - lowLat) / (highLat - lowLat || 0.00001)) * 170}`,
    )
    .join(" ");
}
