import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { color, localDateKey } from "@fitty/core/domain/workouts";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

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
  return (
    <View style={{ gap: space(2) }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Mes anterior", "Previous month")}
          onPress={() => shift(-1)}
          hitSlop={12}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: 22,
              paddingHorizontal: space(3),
            }}
          >
            ‹
          </Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: colors.foreground,
            fontWeight: "700",
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
          <Text
            style={{
              color: colors.accent,
              fontSize: 22,
              paddingHorizontal: space(3),
            }}
          >
            ›
          </Text>
        </Pressable>
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
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${date.toLocaleDateString(locale, { day: "numeric", month: "long" })}${trained ? `, ${t("entrenado", "trained")}` : ""}`}
              onPress={() => onSelect(key)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: active || key === today ? 2 : 0,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: trained ? `${trained}33` : "transparent",
                }}
              >
                <Text style={{ color: colors.foreground }}>
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
