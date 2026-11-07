import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { localDateKey } from "@fitty/core/domain/workouts";
import { useAccount } from "@/state/account";
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

/** Month grid to mark days with menstrual bleeding (tap again to remove). */
export function MenstrualDays({
  dates,
  onChange,
  locale,
}: {
  dates: string[];
  onChange: (dates: string[]) => void;
  locale: string;
}) {
  const { t } = useAccount();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const today = localDateKey(new Date());
  const offset = (month.getDay() + 6) % 7;
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const shift = (by: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));
  return (
    <View style={{ gap: space(3) }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>
        {t(
          "Marcá los días en los que tuviste sangrado menstrual. Tocá de nuevo para quitar una fecha.",
          "Mark days with menstrual bleeding. Tap again to remove a date.",
        )}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Mes anterior", "Previous month")}
          onPress={() => shift(-1)}
        >
          <Text style={navStyle}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.foreground, fontWeight: "800" }}>
          {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Mes siguiente", "Next month")}
          onPress={() => shift(1)}
        >
          <Text style={navStyle}>›</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: 7 }, (_, index) => (
          <Text
            key={`w${index}`}
            style={{
              width: "14.2857%",
              textAlign: "center",
              color: colors.muted,
              fontSize: 12,
              paddingBottom: 4,
            }}
          >
            {new Date(2024, 0, 1 + index).toLocaleDateString(locale, {
              weekday: "short",
            })}
          </Text>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <View key={`b${index}`} style={{ width: "14.2857%" }} />
        ))}
        {Array.from({ length: total }, (_, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const key = localDateKey(date);
          const selected = dates.includes(key);
          const future = key > today;
          return (
            <View key={key} style={{ width: "14.2857%", padding: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: future }}
                accessibilityLabel={date.toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                })}
                disabled={future}
                onPress={() =>
                  onChange(
                    selected
                      ? dates.filter((day) => day !== key)
                      : [...dates, key].sort(),
                  )
                }
                style={{
                  height: 40,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: future ? 0.35 : 1,
                  backgroundColor: selected ? "#f9a8d4" : colors.secondary,
                }}
              >
                <Text
                  style={{
                    color: selected ? "#171717" : colors.foreground,
                    fontWeight: selected ? "800" : "500",
                  }}
                >
                  {index + 1}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
