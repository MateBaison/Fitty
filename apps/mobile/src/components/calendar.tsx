import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { menstrualCalendarEnabled } from "@fitty/core/domain/menstrual-calendar";
import { color, localDateKey } from "@fitty/core/domain/workouts";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const navStyle = {
  color: colors.accent,
  fontSize: 24,
  fontWeight: "700" as const,
  width: 40,
  height: 40,
  lineHeight: 38,
  textAlign: "center" as const,
  borderRadius: 12,
  overflow: "hidden" as const,
  backgroundColor: colors.secondary,
};

/** Month grid; trained days show the session color like the web calendar. */
export function Calendar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const locale = snapshot.settings.language ?? "es";
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const byDay = new Map<string, string>();
  for (const session of snapshot.sessions)
    if (Number.isFinite(Date.parse(session.date)))
      byDay.set(localDateKey(session.date), color(session.color));
  const offset = (month.getDay() + 6) % 7;
  const length = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from(
      { length },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
  const shift = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const today = localDateKey(new Date());
  // Masculine profiles never show menstrual borders, even with saved dates.
  const menstrual = new Set(
    menstrualCalendarEnabled(snapshot.profile)
      ? (snapshot.profile.menstrualCalendar?.dates ?? [])
      : [],
  );
  return (
    <View style={{ gap: space(2) }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Mes anterior", "Previous month")}
          onPress={() => shift(-1)}
          hitSlop={12}
        >
          <Text style={navStyle}>‹</Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: colors.foreground,
            fontSize: 17,
            fontWeight: "800",
            textTransform: "capitalize",
          }}
        >
          {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Mes siguiente", "Next month")}
          onPress={() => shift(1)}
          hitSlop={12}
        >
          <Text style={navStyle}>›</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {Array.from({ length: 7 }, (_, index) => (
          <Text
            key={index}
            style={{
              width: `${100 / 7}%`,
              textAlign: "center",
              color: colors.muted,
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {new Date(2024, 0, 1 + index).toLocaleDateString(locale, {
              weekday: "narrow",
            })}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((date, index) => {
          if (!date)
            return (
              <View
                key={`blank-${index}`}
                style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
              />
            );
          const key = localDateKey(date);
          const trained = byDay.get(key);
          const active = key === selected;
          const bleeding = menstrual.has(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${date.toLocaleDateString(locale, { day: "numeric", month: "long" })}${trained ? `, ${t("entrenado", "trained")}` : ""}${bleeding ? `, ${t("sangrado menstrual registrado", "recorded menstrual bleeding")}` : ""}`}
              onPress={() => onSelect(key)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: active || bleeding || key === today ? 2 : 0,
                  borderColor: active
                    ? colors.primary
                    : bleeding
                      ? "#f472b6"
                      : colors.border,
                  backgroundColor: trained ? `${trained}44` : "transparent",
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: active || trained ? "800" : "500",
                  }}
                >
                  {date.getDate()}
                </Text>
                {trained ? (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: trained,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
