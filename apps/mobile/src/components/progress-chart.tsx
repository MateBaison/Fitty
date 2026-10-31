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
  const coordinates = points.map((point) => ({
    x: 45 + ((point.date.getTime() - first) / span) * 420,
    y: 180 - ((point.value - minimum) / (maximum - minimum)) * 145,
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
      <Svg viewBox="0 0 500 220" width="100%" height={200}>
        {[0, 0.5, 1].map((fraction) => (
          <G key={fraction}>
            <Line
              x1="45"
              x2="465"
              y1={35 + fraction * 145}
              y2={35 + fraction * 145}
              stroke={colors.border}
            />
            <SvgText
              x="3"
              y={39 + fraction * 145}
              fill={colors.muted}
              fontSize="12"
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
        <SvgText x="45" y="212" fill={colors.muted} fontSize="12">
          {day(points[0]!.date)}
        </SvgText>
        <SvgText
          x="465"
          y="212"
          textAnchor="end"
          fill={colors.muted}
          fontSize="12"
        >
          {day(points[points.length - 1]!.date)}
        </SvgText>
      </Svg>
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
