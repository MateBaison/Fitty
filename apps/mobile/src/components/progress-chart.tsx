import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { Label } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

export type ChartPoint = { date: Date; value: number; detail?: string };

/** Line chart of one exercise metric; tapping a date shows its value, like the web. */
export function ProgressChart({
  points,
  unit = "",
}: {
  points: ChartPoint[];
  unit?: string;
}) {
  const { t } = useAccount();
  const locale = useSnapshot().settings.language ?? "es";
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(320);
  if (!points.length)
    return (
      <Label muted>
        {t("Todavía no hay datos para este gráfico.", "No data for this chart yet.")}
      </Label>
    );
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max((high - low) * 0.15, high * 0.05, 1);
  const minimum = Math.max(0, low - pad);
  const maximum = high + pad;
  const first = points[0]!.date.getTime();
  const span = Math.max(1, points[points.length - 1]!.date.getTime() - first);
  const height = 260;
  const left = 50;
  const right = width - 18;
  const top = 18;
  const bottom = height - 38;
  const coordinates = points.map((point) => ({
    x:
      points.length === 1
        ? (left + right) / 2
        : left + ((point.date.getTime() - first) / span) * (right - left),
    y: bottom - ((point.value - minimum) / (maximum - minimum)) * (bottom - top),
  }));
  const index =
    active !== null && active < points.length ? active : points.length - 1;
  const chosen = points[index]!;
  const day = (date: Date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  return (
    <View style={{ gap: space(3) }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>
          {chosen.value.toLocaleString(locale, { maximumFractionDigits: 1 })} {unit}
        </Text>
        <Label muted>
          {chosen.date.toLocaleDateString(locale)}
          {chosen.detail ? ` · ${chosen.detail}` : ""}
        </Label>
      </View>
      <View onLayout={(event) => setWidth(Math.max(240, event.nativeEvent.layout.width))}>
      <Svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <G key={fraction}>
            <Line
              x1={left}
              x2={right}
              y1={top + fraction * (bottom - top)}
              y2={top + fraction * (bottom - top)}
              stroke={colors.border}
            />
            <SvgText
              x={left - 8}
              y={top + 5 + fraction * (bottom - top)}
              textAnchor="end"
              fill={colors.muted}
              fontSize="13"
            >
              {(maximum - fraction * (maximum - minimum)).toLocaleString(locale, {
                maximumFractionDigits: 1,
              })}
            </SvgText>
          </G>
        ))}
        <Polyline
          points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke={colors.primary}
          strokeWidth="3"
        />
        {coordinates.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={index === i ? 7 : 4}
            fill={colors.primary}
          />
        ))}
        {/* Larger invisible targets so each point can be tapped. */}
        {coordinates.map((point, i) => (
          <Circle
            key={`hit-${i}`}
            cx={point.x}
            cy={point.y}
            r={16}
            fill="transparent"
            onPress={() => setActive(i)}
          />
        ))}
        <SvgText x={left} y={height - 10} fill={colors.muted} fontSize="13">
          {day(points[0]!.date)}
        </SvgText>
        <SvgText
          x={right}
          y={height - 10}
          textAnchor="end"
          fill={colors.muted}
          fontSize="13"
        >
          {day(points[points.length - 1]!.date)}
        </SvgText>
      </Svg>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
        {points.map((point, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected: index === i }}
            onPress={() => setActive(i)}
            style={{
              paddingHorizontal: space(3),
              minHeight: 36,
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor: index === i ? colors.primary : colors.secondary,
              borderColor: index === i ? colors.primary : colors.border,
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                color: index === i ? colors.primaryForeground : colors.foreground,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {day(point.date)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
