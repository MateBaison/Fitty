import { useKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { timeFormat } from "@fitty/core/domain/combat";
import type { TrackingSession } from "@fitty/core/domain/schemas/snapshot";
import {
  gpsReading,
  recordedRoute,
  routePoints,
  type GPSReading,
  type Point,
} from "@fitty/core/domain/tracking";
import { ChipGroup } from "@/components/chip";
import { Notice } from "@/components/notice";
import { RouteMap } from "@/components/route-map";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import {
  TRACKING_TASK,
  clearTrackingBuffer,
  setTrackingListener,
} from "@/lib/tracking-feed";
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        width: "48.5%",
        padding: space(3),
        borderRadius: 14,
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.secondary,
        gap: 2,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
        {value}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/**
 * Foreground GPS route recording with a street map, live stats and saved routes.
 * Unfinished routes stay in memory only; a finished route is saved through the
 * normal account change/sync path.
 */
export function TrackingPanel() {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const kilometers = (snapshot.settings.distance ?? "km") === "km";
  const language = snapshot.settings.language ?? "es";
  const [mode, setMode] = useState<"run" | "cycle">("run");
  const [prep, setPrep] = useState("10");
  const [prepEnd, setPrepEnd] = useState<number | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [now, setNow] = useState(Date.now());
  const [viewing, setViewing] = useState<TrackingSession | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const background = useRef(false);
  const modeRef = useRef<"run" | "cycle">("run");
  const reading = useRef<GPSReading | null>(null);
  const fixTime = useRef(0);
  const stopWatch = () => {
    subscription.current?.remove();
    subscription.current = null;
    setTrackingListener(null);
    clearTrackingBuffer();
    if (background.current) {
      background.current = false;
      void Location.stopLocationUpdatesAsync(TRACKING_TASK).catch(() => {});
    }
  };
  useEffect(() => stopWatch, []);
  useEffect(() => {
    if (!track && prepEnd === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [track, prepEnd]);
  const distance = (meters: number) =>
    kilometers
      ? `${(meters / 1000).toFixed(2)} km`
      : `${(meters / 1609.344).toFixed(2)} mi`;
  const pace = (meters: number, seconds: number) => {
    const unit = kilometers ? 1000 : 1609.344;
    if (meters < 10 || seconds <= 0) return "—";
    return `${timeFormat((seconds / meters) * unit)} /${kilometers ? "km" : "mi"}`;
  };
  const begin = async () => {
    reading.current = null;
    fixTime.current = 0;
    const current: Track = {
      mode,
      started: Date.now(),
      distance: 0,
      points: [],
      speed: 0,
    };
    setPrepEnd(null);
    setTrack(current);
    modeRef.current = current.mode;
    const handle = (position: Location.LocationObject) => {
      const result = gpsReading(
        reading.current,
        {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          time: position.timestamp,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy ?? Number.NaN,
        },
        modeRef.current,
        Date.now(),
      );
      if (!result) return;
      reading.current = result.reading;
      fixTime.current = Date.now();
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
    };
    // Foreground updates arrive at once and drive the screen. With "always"
    // access a background task keeps recording with the phone locked; fixes
    // seen twice are discarded because their timestamps do not move forward.
    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      handle,
    );
    try {
      const allowed = (await Location.getBackgroundPermissionsAsync()).granted;
      if (allowed) {
        setTrackingListener((positions) => positions.forEach(handle));
        await Location.startLocationUpdatesAsync(TRACKING_TASK, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
          activityType: Location.ActivityType.Fitness,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Fitty",
            notificationBody: t(
              "Registrando tu recorrido",
              "Recording your route",
            ),
          },
        });
        background.current = true;
      }
    } catch {
      setTrackingListener(null);
    }
  };
  // The countdown ends by itself and starts recording.
  useEffect(() => {
    if (prepEnd !== null && now >= prepEnd) void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, prepEnd]);
  const start = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      return notify(
        t(
          "No se pudo acceder a tu ubicación. Revisá el permiso en Ajustes.",
          "Couldn't access your location. Check the permission in Settings.",
        ),
      );
    // Ask for "always" access too, so the route keeps recording with the phone locked.
    try {
      const always = await Location.requestBackgroundPermissionsAsync();
      if (!always.granted)
        notify(
          t(
            "Sin permiso 'Siempre' el recorrido solo se registra con la app abierta.",
            "Without 'Always' access the route only records while the app is open.",
          ),
        );
    } catch {
      // Older builds without background support keep foreground tracking.
    }
    const seconds = Math.max(0, Math.min(600, Number(prep) || 0));
    if (seconds > 0) {
      setNow(Date.now());
      setPrepEnd(Date.now() + seconds * 1000);
    } else await begin();
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
      ) {
        notify(t("Recorrido guardado", "Route saved"));
        setViewing(record);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  };
  const history = [...(snapshot.trackingSessions ?? [])]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 20);
  const elapsed = track ? Math.floor((now - track.started) / 1000) : 0;
  const preparing = prepEnd !== null && !track;
  const activeMode = track?.mode ?? mode;
  const speed =
    track && now - fixTime.current <= 10000 ? track.speed : 0;
  const speedLabel =
    speed >= 0.5
      ? activeMode === "cycle"
        ? `${(speed * (kilometers ? 3.6 : 2.236936)).toFixed(1)} ${kilometers ? "km/h" : "mph"}`
        : `${timeFormat((kilometers ? 1000 : 1609.344) / speed)} /${kilometers ? "km" : "mi"}`
      : "—";
  const kg =
    Number(snapshot.profile.weight ?? 75) /
    (snapshot.settings.weight === "lb" ? 2.20462 : 1);
  const kcal = Math.round(
    ((activeMode === "run" ? 9.8 : 7.5) * (Number.isFinite(kg) && kg > 0 ? kg : 75) * elapsed) / 3600,
  );
  const describe = (session: TrackingSession) =>
    `${new Date(session.date).toLocaleString(language)} · ${
      session.mode === "cycle" ? t("Bicicleta", "Cycling") : t("Correr", "Run")
    }`;
  return (
    <>
      <Notice />
      <Card>
        {track ? <KeepAwake /> : null}
        <ChipGroup
          options={[
            { value: "run" as const, label: t("Correr", "Run") },
            { value: "cycle" as const, label: t("Bicicleta", "Cycling") },
          ]}
          value={activeMode}
          onChange={(value) => !track && !preparing && setMode(value)}
        />
        {!track ? (
          <Field
            label={t("Preparación inicial (seg)", "Initial preparation (sec)")}
            value={prep}
            onChangeText={(text) => setPrep(text.replace(/\D/g, "").slice(0, 3))}
            keyboardType="number-pad"
            editable={!preparing}
          />
        ) : null}
        {preparing ? (
          <Text
            accessibilityRole="timer"
            style={{
              color: colors.warning,
              fontSize: 48,
              fontWeight: "800",
              textAlign: "center",
              fontVariant: ["tabular-nums"],
            }}
          >
            {t("Preparación:", "Preparation:")}{" "}
            {timeFormat(Math.max(0, Math.ceil((prepEnd - now) / 1000)))}
          </Text>
        ) : null}
        <RouteMap points={track?.points ?? []} live={!!track} locateOnOpen />
        {track && !track.points.length ? (
          <Label muted>
            {t(
              "Buscando señal GPS… puede tardar unos segundos al aire libre.",
              "Looking for a GPS signal… it can take a few seconds outdoors.",
            )}
          </Label>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2), justifyContent: "space-between" }}>
          <Metric value={timeFormat(elapsed)} label={t("Tiempo", "Time")} />
          <Metric value={distance(track?.distance ?? 0)} label={t("Distancia", "Distance")} />
          <Metric
            value={speedLabel}
            label={activeMode === "cycle" ? t("Velocidad", "Speed") : t("Ritmo", "Pace")}
          />
          <Metric value={`${kcal} kcal`} label={t("Estimación", "Estimate")} />
        </View>
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
            {t("Finalizar", "Finish")}
          </Button>
        ) : preparing ? (
          <Button variant="secondary" onPress={() => setPrepEnd(null)}>
            {t("Cancelar preparación", "Cancel preparation")}
          </Button>
        ) : (
          <Button onPress={() => void start()}>{t("Iniciar GPS", "Start GPS")}</Button>
        )}
        <Label muted>
          {t(
            "Mantené Fitty abierta durante el recorrido: el GPS se registra con la app en primer plano.",
            "Keep Fitty open during the route: GPS is recorded while the app is in the foreground.",
          )}
        </Label>
      </Card>
      <Label>{t("Recorridos guardados", "Saved routes")}</Label>
      {!history.length ? (
        <Label muted>
          {t(
            "Al finalizar una actividad con GPS, tu recorrido se guarda aquí.",
            "Finish a GPS activity to save its route here.",
          )}
        </Label>
      ) : null}
      {history.map((session) => (
        <Pressable
          key={session.id}
          accessibilityRole="button"
          onPress={() => setViewing(session)}
        >
          <Card>
            <Label>{describe(session)}</Label>
            <Label muted>
              {distance(session.distanceMeters)} ·{" "}
              {timeFormat(session.durationSeconds)} ·{" "}
              {pace(session.distanceMeters, session.durationSeconds)}
            </Label>
            <RouteShape points={session.points} />
          </Card>
        </Pressable>
      ))}
      <Modal
        visible={viewing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Cerrar", "Close")}
            onPress={() => setViewing(null)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {viewing ? (
            <Card>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>
                {t("Recorrido guardado", "Saved route")}
              </Text>
              <Label muted>{describe(viewing)}</Label>
              <Label muted>
                {distance(viewing.distanceMeters)} ·{" "}
                {timeFormat(viewing.durationSeconds)} ·{" "}
                {pace(viewing.distanceMeters, viewing.durationSeconds)}
              </Label>
              <RouteMap key={viewing.id} points={viewing.points} />
              <Button variant="secondary" onPress={() => setViewing(null)}>
                {t("Cerrar", "Close")}
              </Button>
            </Card>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export default function Tracking() {
  const router = useRouter();
  const { t } = useAccount();
  return (
    <Screen>
      <Button variant="secondary" onPress={() => router.back()}>
        {`‹ ${t("Volver", "Back")}`}
      </Button>
      <TrackingPanel />
    </Screen>
  );
}
