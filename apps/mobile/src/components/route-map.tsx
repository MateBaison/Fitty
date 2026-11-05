import { Image } from "expo-image";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import type { Point } from "@fitty/core/domain/tracking";
import { Button, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

const TILE = 256;
const MIN_ZOOM = 2;
const MAX_ZOOM = 16;
// One place to swap the street-map provider.
const tileUrl = (z: number, x: number, y: number) =>
  `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${z}/${y}/${x}`;

const worldSize = (zoom: number) => TILE * 2 ** zoom;
function project(lat: number, lon: number, zoom: number) {
  const size = worldSize(zoom);
  const sin = Math.min(0.9999, Math.max(-0.9999, Math.sin((lat * Math.PI) / 180)));
  return {
    x: ((lon + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}
function unproject(x: number, y: number, zoom: number) {
  const size = worldSize(zoom);
  const n = Math.PI - (2 * Math.PI * y) / size;
  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lon: (x / size) * 360 - 180,
  };
}

type View2 = { lat: number; lon: number; zoom: number };
type Spot = { lat: number; lon: number };

/**
 * Street map drawn from raster tiles in plain JavaScript (no native map module),
 * with the recorded route, start and current position on top.
 */
export function RouteMap({
  points,
  live = false,
  locateOnOpen = false,
  height = 300,
}: {
  points: Point[];
  live?: boolean;
  locateOnOpen?: boolean;
  height?: number;
}) {
  const { t } = useAccount();
  const [size, setSize] = useState({ width: 0, height });
  const [view, setView] = useState<View2>({ lat: 0, lon: 0, zoom: 2 });
  const [follow, setFollow] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [preview, setPreview] = useState<Spot | null>(null);
  const initialized = useRef(false);
  const latest = useRef({ view, size });
  latest.current = { view, size };
  const dragStart = useRef({ x: 0, y: 0 });

  const fit = (list: Point[]) => {
    const { width, height: tall } = latest.current.size;
    if (!width || !list.length) return;
    const lats = list.map((point) => point.lat);
    const lons = list.map((point) => point.lon);
    const bounds = {
      south: Math.min(...lats),
      north: Math.max(...lats),
      west: Math.min(...lons),
      east: Math.max(...lons),
    };
    const lat = (bounds.south + bounds.north) / 2;
    const lon = (bounds.west + bounds.east) / 2;
    let zoom = 17;
    for (; zoom > MIN_ZOOM; zoom -= 1) {
      const a = project(bounds.north, bounds.west, zoom);
      const b = project(bounds.south, bounds.east, zoom);
      if (b.x - a.x <= width - 40 && b.y - a.y <= tall - 40) break;
    }
    setView({ lat, lon, zoom });
  };

  const last = points.at(-1);
  // A new recording starts from a fresh view instead of the previous route.
  useEffect(() => {
    if (!points.length) initialized.current = false;
  }, [points.length]);
  useEffect(() => {
    if (!size.width || !last) return;
    setLocationError(false);
    if (!initialized.current) {
      initialized.current = true;
      if (live || points.length === 1) setView({ lat: last.lat, lon: last.lon, zoom: 16 });
      else fit(points);
    } else if (live && follow) {
      setView((current) => ({ ...current, lat: last.lat, lon: last.lon }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, size.width, live, follow]);

  // Show where the person is before the route starts.
  useEffect(() => {
    if (!locateOnOpen || live || points.length) return;
    let cancelled = false;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("denied");
        // The last known position shows the map at once; the fresh one refines it.
        const known = await Location.getLastKnownPositionAsync();
        if (known && !cancelled && !initialized.current) {
          const spot = { lat: known.coords.latitude, lon: known.coords.longitude };
          setPreview(spot);
          setLocationError(false);
          setView({ ...spot, zoom: 16 });
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled || initialized.current) return;
        const spot = { lat: position.coords.latitude, lon: position.coords.longitude };
        setPreview(spot);
        setLocationError(false);
        setView({ ...spot, zoom: 16 });
      } catch {
        if (!cancelled) setLocationError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locateOnOpen, live, points.length]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const { view: v } = latest.current;
          const p = project(v.lat, v.lon, v.zoom);
          dragStart.current = p;
        },
        onPanResponderMove: (_, gesture) => {
          const { view: v } = latest.current;
          const next = unproject(
            dragStart.current.x - gesture.dx,
            dragStart.current.y - gesture.dy,
            v.zoom,
          );
          setFollow(false);
          setView({ ...v, ...next });
        },
      }),
    [],
  );

  const zoomBy = (delta: number) =>
    setView((current) => ({
      ...current,
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom + delta)),
    }));

  const centerOnMe = async () => {
    const spot = live || points.length ? last : preview;
    if (spot) {
      setFollow(true);
      setView({ lat: spot.lat, lon: spot.lon, zoom: 16 });
      return;
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("denied");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const here = { lat: position.coords.latitude, lon: position.coords.longitude };
      setPreview(here);
      setLocationError(false);
      setView({ ...here, zoom: 16 });
    } catch {
      setLocationError(true);
    }
  };

  const center = project(view.lat, view.lon, view.zoom);
  const originX = center.x - size.width / 2;
  const originY = center.y - size.height / 2;
  const count = 2 ** view.zoom;
  const tiles: { key: string; x: number; y: number; left: number; top: number }[] = [];
  if (size.width) {
    const x0 = Math.floor(originX / TILE);
    const x1 = Math.floor((originX + size.width) / TILE);
    const y0 = Math.max(0, Math.floor(originY / TILE));
    const y1 = Math.min(count - 1, Math.floor((originY + size.height) / TILE));
    for (let ty = y0; ty <= y1; ty += 1)
      for (let tx = x0; tx <= x1; tx += 1)
        tiles.push({
          key: `${view.zoom}/${tx}/${ty}`,
          x: ((tx % count) + count) % count,
          y: ty,
          left: Math.round(tx * TILE - originX),
          top: Math.round(ty * TILE - originY),
        });
  }
  const screen = (point: Spot) => {
    const p = project(point.lat, point.lon, view.zoom);
    return { x: p.x - originX, y: p.y - originY };
  };
  const line = points.map((point) => {
    const p = screen(point);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });
  const here = !live && preview && !points.length ? screen(preview) : last ? screen(last) : null;
  const start = points[0] ? screen(points[0]) : null;

  return (
    <View style={{ gap: space(2) }}>
      <View
        accessibilityLabel={t("Mapa del recorrido", "Route map")}
        onLayout={({ nativeEvent }) =>
          setSize({ width: nativeEvent.layout.width, height })
        }
        {...pan.panHandlers}
        style={{
          height,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#e6e8eb",
          borderColor: colors.border,
          borderWidth: 1,
        }}
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={tileUrl(view.zoom, tile.x, tile.y)}
            cachePolicy="disk"
            onError={() => setTileError(true)}
            style={{
              position: "absolute",
              left: tile.left,
              top: tile.top,
              width: TILE,
              height: TILE,
            }}
          />
        ))}
        {size.width ? (
          <Svg
            pointerEvents="none"
            width={size.width}
            height={size.height}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            {line.length > 1 ? (
              <>
                <Polyline
                  points={line.join(" ")}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={9}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <Polyline
                  points={line.join(" ")}
                  fill="none"
                  stroke="#1d6fd8"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            ) : null}
            {start ? (
              <Circle cx={start.x} cy={start.y} r={7} fill="#16a34a" stroke="#fff" strokeWidth={3} />
            ) : null}
            {here ? (
              <Circle cx={here.x} cy={here.y} r={8} fill="#1d6fd8" stroke="#fff" strokeWidth={3} />
            ) : null}
          </Svg>
        ) : null}
        <View style={{ position: "absolute", right: 8, top: 8, gap: 6 }}>
          {([["+", 1], ["−", -1]] as const).map(([symbol, delta]) => (
            <Pressable
              key={symbol}
              accessibilityRole="button"
              accessibilityLabel={delta > 0 ? t("Acercar", "Zoom in") : t("Alejar", "Zoom out")}
              onPress={() => zoomBy(delta)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffffee",
              }}
            >
              <Text style={{ color: "#1f2937", fontSize: 24, fontWeight: "600" }}>{symbol}</Text>
            </Pressable>
          ))}
        </View>
        <Text
          style={{
            position: "absolute",
            right: 6,
            bottom: 4,
            fontSize: 10,
            color: "#374151",
            backgroundColor: "#ffffffcc",
            paddingHorizontal: 4,
          }}
        >
          © Esri
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: space(2) }}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" onPress={() => void centerOnMe()}>
            {t("Centrar ubicación", "Center location")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            disabled={points.length < 2}
            onPress={() => {
              setFollow(false);
              fit(points);
            }}
          >
            {t("Recorrido completo", "Full route")}
          </Button>
        </View>
      </View>
      {tileError ? (
        <Label muted>
          {t(
            "El mapa de calles no pudo cargarse. El GPS y el registro del recorrido siguen disponibles.",
            "Street tiles could not load. GPS and route recording remain available.",
          )}
        </Label>
      ) : null}
      {locationError ? (
        <Label>
          {t(
            "Permití el acceso a tu ubicación en Ajustes.",
            "Allow location access in Settings.",
          )}
        </Label>
      ) : null}
    </View>
  );
}
