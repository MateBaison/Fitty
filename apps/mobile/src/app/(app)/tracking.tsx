import { useKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { timeFormat } from "@fitty/core/domain/combat";
import {
  gpsReading,
  recordedRoute,
  routePoints,
  type GPSReading,
  type Point,
} from "@fitty/core/domain/tracking";
import { ChipGroup } from "@/components/chip";
import { Notice } from "@/components/notice";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

type Track = {
  mode: "run" | "cycle";
  started: number;
  distance: number;
  points: Point[];
  speed: number;
};

function KeepAwake() {
  useKeepAwake();
  return null;
}

function RouteShape({ points }: { points: Point[] }) {
  const path = routePoints(points);
  return (
    <Svg
      viewBox="0 0 320 210"
      style={{ width: "100%", aspectRatio: 320 / 210 }}
    >
      {path ? (
        <Polyline
          points={path}
          fill="none"
          stroke={colors.primary}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

/**
 * Foreground GPS route recording. Unfinished routes stay in memory only;
 * a finished route is saved through the normal account change/sync path.
 */
export default function Tracking() {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const router = useRouter();
  const kilometers = (snapshot.settings.distance ?? "km") === "km";
  const [mode, setMode] = useState<"run" | "cycle">("run");
  const [track, setTrack] = useState<Track | null>(null);
  const [now, setNow] = useState(Date.now());
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const reading = useRef<GPSReading | null>(null);
  const stopWatch = () => {
    subscription.current?.remove();
    subscription.current = null;
  };
  useEffect(() => stopWatch, []);
  useEffect(() => {
    if (!track) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [track]);
  const distance = (meters: number) =>
    kilometers
      ? `${(meters / 1000).toFixed(2)} km`
      : `${(meters / 1609.344).toFixed(2)} mi`;
  const pace = (meters: number, seconds: number) => {
    const unit = kilometers ? 1000 : 1609.344;
    if (meters < 10 || seconds <= 0) return "—";
    return `${timeFormat((seconds / meters) * unit)} /${kilometers ? "km" : "mi"}`;
  };
  const start = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      return notify(
        t(
          "No se pudo acceder a tu ubicación. Revisá el permiso en Ajustes.",
          "Couldn't access your location. Check the permission in Settings.",
        ),
      );
    reading.current = null;
    const current: Track = {
      mode,
      started: Date.now(),
      distance: 0,
      points: [],
      speed: 0,
    };
    setTrack(current);
    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (position) => {
        const result = gpsReading(
          reading.current,
          {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            time: position.timestamp,
            speed: position.coords.speed,
            accuracy: position.coords.accuracy ?? Number.NaN,
          },
          current.mode,
          Date.now(),
        );
        if (!result) return;
        reading.current = result.reading;
        setTrack((previous) =>
          previous
            ? {
                ...previous,
                distance: previous.distance + result.distance,
                speed: result.reading.speed,
                points: [
                  ...previous.points,
                  {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    time: position.timestamp,
                    speed: result.reading.speed,
                  },
                ],
              }
            : previous,
        );
      },
    );
  };
  const finish = () => {
    stopWatch();
    const current = track;
    setTrack(null);
    if (!current || current.points.length < 2) {
      notify(
        t(
          "El recorrido es demasiado corto para guardarlo.",
          "The route is too short to save.",
        ),
      );
      return;
    }
    try {
      const record = recordedRoute(current, Date.now());
      if (
        change((draft) => void (draft.trackingSessions ??= []).unshift(record))
      )
        notify(t("Recorrido guardado", "Route saved"));
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  };
  const history = [...(snapshot.trackingSessions ?? [])]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 20);
  const elapsed = track ? Math.floor((now - track.started) / 1000) : 0;
  return (
    <Screen>
      <Button variant="ghost" onPress={() => router.back()}>
        {`‹ ${t("Volver", "Back")}`}
      </Button>
      <Title>{t("Recorrido GPS", "GPS route")}</Title>
      <Notice />
      <Card>
        {track ? <KeepAwake /> : null}
        <ChipGroup
          options={[
            { value: "run" as const, label: t("Correr", "Run") },
            { value: "cycle" as const, label: t("Bicicleta", "Cycling") },
          ]}
          value={track?.mode ?? mode}
          onChange={(value) => !track && setMode(value)}
        />
        <Text
          accessibilityRole="timer"
          style={{
            color: colors.foreground,
            fontSize: 48,
            fontWeight: "800",
            textAlign: "center",
            fontVariant: ["tabular-nums"],
          }}
        >
          {timeFormat(elapsed)}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <Label>{distance(track?.distance ?? 0)}</Label>
          <Label>{pace(track?.distance ?? 0, elapsed)}</Label>
          <Label>{((track?.speed ?? 0) * 3.6).toFixed(1)} km/h</Label>
        </View>
        {track ? <RouteShape points={track.points} /> : null}
        {track ? (
          <Button
            variant="destructive"
            onPress={() =>
              Alert.alert(
                t("¿Terminar recorrido?", "Finish route?"),
                undefined,
                [
                  { text: t("Seguir", "Keep going"), style: "cancel" },
                  {
                    text: t("Terminar y guardar", "Finish and save"),
                    onPress: finish,
                  },
                ],
              )
            }
          >
            {t("Terminar", "Finish")}
          </Button>
        ) : (
          <Button onPress={() => void start()}>{t("Iniciar", "Start")}</Button>
        )}
        <Label muted>
          {t(
            "Mantené Fitty abierta durante el recorrido: el GPS se registra con la app en primer plano.",
            "Keep Fitty open during the route: GPS is recorded while the app is in the foreground.",
          )}
        </Label>
      </Card>
      {history.map((session) => (
        <Card key={session.id}>
          <Label>
            {session.mode === "run"
              ? t("Correr", "Run")
              : t("Bicicleta", "Cycling")}{" "}
            ·{" "}
            {new Date(session.date).toLocaleDateString(
              snapshot.settings.language ?? "es",
              {
                day: "numeric",
                month: "short",
              },
            )}
          </Label>
          <Label muted>
            {distance(session.distanceMeters)} ·{" "}
            {timeFormat(session.durationSeconds)} ·{" "}
            {pace(session.distanceMeters, session.durationSeconds)}
          </Label>
          <RouteShape points={session.points} />
        </Card>
      ))}
    </Screen>
  );
}
