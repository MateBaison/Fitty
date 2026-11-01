import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, Switch, Text, View } from "react-native";
import { exerciseImage } from "@fitty/core/data/exercises";
import { localizedSetTypes } from "@fitty/core/data/set-types";
import { translate } from "@fitty/core/data/translations";
import {
  blankSet,
  setNumber,
  switchEntryMetric,
  type Entry,
} from "@fitty/core/domain/workouts";
import { NumberInput } from "@/components/number-input";
import { typeColor } from "@/components/set-type-dialog";
import { Button, Card, Field, Label } from "@/components/ui";
import { env } from "@/lib/env";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/**
 * One exercise with its sets, laid out like the cards of a workout in progress,
 * so editing a saved workout looks the same as doing one.
 */
export function EntryCard({
  entry,
  exercise,
  expanded,
  onToggle,
  onChange,
  onTypePress,
}: {
  entry: Entry;
  exercise: { name: string; image: string; id: string } | undefined;
  expanded: boolean;
  onToggle: () => void;
  onChange: (edit: (entry: Entry) => void) => void;
  onTypePress: (set: number) => void;
}) {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const types = localizedSetTypes(language);
  const metric = entry.tracking === "seconds" ? "seconds" : "reps";
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}
      >
        {exercise ? (
          <Image
            source={`${env.apiUrl}${exerciseImage(exercise as never, snapshot.profile.gender)}`}
            style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: "#0d1016" }}
            contentFit="cover"
            cachePolicy="disk"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }}>
            {exercise ? translate(language, exercise.name, exercise.name) : entry.id}
          </Text>
          <Label muted>
            {entry.sets.length} {t("series", "sets")}
          </Label>
        </View>
        <SymbolView
          name={
            expanded
              ? { ios: "chevron.up", android: "expand_less" }
              : { ios: "chevron.down", android: "expand_more" }
          }
          tintColor={colors.muted}
          size={16}
        />
      </Pressable>
      {expanded ? (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: space(2),
              borderRadius: 16,
              borderColor: colors.border,
              borderWidth: 1,
              paddingHorizontal: space(2.5),
              height: 52,
              alignSelf: "center",
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 13 }}>{t("Rep", "Reps")}</Text>
            <View style={{ height: 52, justifyContent: "center" }}>
              <Switch
                accessibilityLabel={t("Registrar por tiempo", "Track by time")}
                value={metric === "seconds"}
                trackColor={{ true: colors.primary, false: colors.border }}
                onValueChange={(checked) =>
                  onChange((draft) =>
                    switchEntryMetric(draft, metric, checked ? "seconds" : "reps"),
                  )
                }
              />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{t("Temp", "Time")}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: space(2) }}>
            <Label muted style={{ width: 44, textAlign: "center" }}>
              {t("Serie", "Set")}
            </Label>
            <Label muted style={{ flex: 1, textAlign: "center" }}>
              {unit}
            </Label>
            <Label muted style={{ flex: 1, textAlign: "center" }}>
              {metric === "seconds" ? t("Seg", "Sec") : t("Rep", "Reps")}
            </Label>
            <Label muted style={{ width: 44, textAlign: "center" }}>
              {t("Tipo", "Type")}
            </Label>
          </View>
          {entry.sets.map((set, number) => {
            const type = types.find((item) => item.id === (set.type ?? "normal")) ?? types[0];
            return (
              <View key={number} style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
                <Text
                  style={{
                    width: 44,
                    textAlign: "center",
                    color: colors.foreground,
                    fontSize: 17,
                    fontWeight: "800",
                  }}
                >
                  {setNumber(entry.sets, number)}
                </Text>
                <NumberInput
                  decimal
                  value={set.kg}
                  accessibilityLabel={`${t("Peso", "Weight")} ${number + 1}`}
                  onCommit={(value) =>
                    onChange((draft) => {
                      const current = draft.sets[number];
                      if (current) {
                        current.kg = value ?? 0;
                        current.entered = true;
                      }
                    })
                  }
                />
                <NumberInput
                  value={set[metric]}
                  accessibilityLabel={`${metric === "seconds" ? t("Segundos", "Seconds") : t("Repeticiones", "Repetitions")} ${number + 1}`}
                  onCommit={(value) =>
                    onChange((draft) => {
                      const current = draft.sets[number];
                      if (current) {
                        current[metric] = value;
                        current.entered = true;
                      }
                    })
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t("Tipo de serie", "Set type")} ${number + 1}: ${type?.name ?? ""}`}
                  onPress={() => onTypePress(number)}
                  style={{
                    width: 44,
                    minHeight: 52,
                    borderRadius: 14,
                    borderColor: colors.border,
                    borderWidth: 1,
                    backgroundColor: colors.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: typeColor[type?.id ?? "normal"], fontSize: 17, fontWeight: "800" }}>
                    {type?.letter ?? "N"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
          <View style={{ flexDirection: "row", gap: space(3) }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                disabled={entry.sets.length <= 1}
                onPress={() => onChange((draft) => void draft.sets.pop())}
              >
                {t("− Serie", "− Set")}
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                onPress={() => onChange((draft) => void draft.sets.push(blankSet(metric)))}
              >
                {t("+ Serie", "+ Set")}
              </Button>
            </View>
          </View>
          <Field
            label={t("Nota de este ejercicio", "Note for this exercise")}
            value={entry.note ?? ""}
            onChangeText={(note) => onChange((draft) => void (draft.note = note))}
            maxLength={500}
            multiline
          />
        </>
      ) : null}
    </Card>
  );
}
