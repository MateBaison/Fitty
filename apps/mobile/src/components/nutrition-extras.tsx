import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  extraAmount,
  nutritionExtraGroups,
  nutritionSources,
} from "@fitty/core/domain/calculations/nutrition-extras";
import { Label } from "@/components/ui";
import { openWebPage } from "@/lib/open-link";
import { useAccount } from "@/state/account";
import { colors, radius, space } from "@/theme";

function Header({
  title,
  detail,
  open,
  large,
  onPress,
}: {
  title: string;
  detail?: string | null;
  open: boolean;
  large?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space(3),
        minHeight: large ? 60 : 52,
        padding: space(3),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: large ? 18 : 15,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>
        {detail ? (
          <Label muted style={{ fontSize: 13 }}>
            {detail}
          </Label>
        ) : null}
      </View>
      <SymbolView
        name={
          open
            ? { ios: "chevron.up", android: "expand_less" }
            : { ios: "chevron.down", android: "expand_more" }
        }
        tintColor={colors.muted}
        size={16}
      />
    </Pressable>
  );
}

/** The long "Extras" bar under the macros: what else to watch, and why. */
export function NutritionExtras({ calories }: { calories: number }) {
  const { t } = useAccount();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<readonly string[]>([]);
  const heading = {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "800" as const,
    marginTop: space(2),
    marginHorizontal: space(1),
  };
  return (
    <View
      style={{
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.secondary,
      }}
    >
      <Header
        large
        title={t("Extras", "Extras")}
        detail={t(
          "Fibra, frutas, vitaminas y qué limitar",
          "Fiber, fruit, vitamins and what to limit",
        )}
        open={open}
        onPress={() => setOpen(!open)}
      />
      {open ? (
        <View style={{ padding: space(2), paddingTop: 0, gap: space(2) }}>
          {nutritionExtraGroups.map((group) => (
            <View key={group.id} style={{ gap: space(2) }}>
              <Text accessibilityRole="header" style={heading}>
                {t(...group.title)}
              </Text>
              {group.items.map((item) => {
                const expanded = shown.includes(item.id);
                return (
                  <View
                    key={item.id}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }}
                  >
                    <Header
                      title={t(...item.name)}
                      detail={extraAmount(item, calories, t)}
                      open={expanded}
                      onPress={() =>
                        setShown(
                          expanded
                            ? shown.filter((id) => id !== item.id)
                            : [...shown, item.id],
                        )
                      }
                    />
                    {expanded ? (
                      <View
                        style={{
                          paddingHorizontal: space(3),
                          paddingBottom: space(3),
                          gap: space(2),
                        }}
                      >
                        <Label>{t(...item.benefit)}</Label>
                        <View style={{ gap: 2 }}>
                          <Label muted style={{ fontSize: 13 }}>
                            {group.id === "limits"
                              ? t("Dónde está", "Where it hides")
                              : t("Dónde encontrarlo", "Where to find it")}
                          </Label>
                          <Label>{t(...item.foods)}</Label>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
          <Label muted style={{ fontSize: 13, marginHorizontal: space(1) }}>
            {t(
              "Cifras generales para adultos sanos; pueden cambiar con la edad, el embarazo o la salud.",
              "General figures for healthy adults; age, pregnancy or health can change them.",
            )}
          </Label>
          <Text accessibilityRole="header" style={heading}>
            {t("Fuentes", "Sources")}
          </Text>
          {nutritionSources.map((source) => (
            <Pressable
              key={source.url}
              accessibilityRole="link"
              onPress={() => void openWebPage(source.url)}
              style={{
                minHeight: 36,
                justifyContent: "center",
                paddingHorizontal: space(1),
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 14 }}>
                {source.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
