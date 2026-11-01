import { Pressable, Text, View } from "react-native";
import type { Extras } from "@fitty/core/domain/workouts";
import { Field, Label } from "@/components/ui";
import { PhotoStrip } from "@/components/photo-strip";
import { ResizableInput } from "@/components/resizable-input";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const trainingColors = [
  { value: "#ff5538", es: "Rojo", en: "Red" },
  { value: "#fb923c", es: "Naranja", en: "Orange" },
  { value: "#facc15", es: "Amarillo", en: "Yellow" },
  { value: "#4ade80", es: "Verde", en: "Green" },
  { value: "#38bdf8", es: "Azul", en: "Blue" },
  { value: "#a78bfa", es: "Violeta", en: "Purple" },
  { value: "#f472b6", es: "Rosa", en: "Pink" },
] as const;

const ratings = [
  ["very_bad", "😣", "Muy mal", "Very badly"],
  ["bad", "😕", "Mal", "Badly"],
  ["okay", "😐", "Regular", "Okay"],
  ["good", "😊", "Bien", "Well"],
  ["excellent", "🤩", "Muy bien", "Very well"],
] as const;

/** Same options the web offers when finishing a workout. */
export function SessionExtras({
  value,
  onChange,
  onResizing,
}: {
  value: Extras;
  onChange: (value: Extras) => void;
  onResizing?: (resizing: boolean) => void;
}) {
  const { t } = useAccount();
  const unit = useSnapshot().settings.weight ?? "kg";
  const factor = unit === "lb" ? 2.20462 : 1;
  const weightField = (key: "bodyWeightStartKg" | "bodyWeightEndKg", label: string) => {
    const current = value[key];
    return (
      <View style={{ flex: 1 }}>
        <Field
          label={`${label} (${unit})`}
          keyboardType="decimal-pad"
          defaultValue={
            current === null ? "" : String(Math.round(current * factor * 10) / 10)
          }
          onChangeText={(input) => {
            const text = input.replace(",", ".").trim();
            const parsed = text === "" ? null : Number(text);
            onChange({
              ...value,
              [key]:
                parsed === null || !Number.isFinite(parsed) || parsed <= 0
                  ? null
                  : parsed / factor,
            });
          }}
        />
      </View>
    );
  };
  return (
    <View style={{ gap: space(4) }}>
      <View style={{ gap: space(2) }}>
        <Label muted>{t("Color del calendario", "Calendar color")}</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
          {trainingColors.map((option) => {
            const active = value.color.toLowerCase() === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={t(option.es, option.en)}
                accessibilityState={{ selected: active }}
                onPress={() => onChange({ ...value, color: option.value })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: option.value,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: active ? 3 : 0,
                  borderColor: "#ffffff",
                }}
              >
                {active ? (
                  <Text style={{ color: "#0b0e14", fontWeight: "900" }}>✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: space(2) }}>
        <Label muted>{t("¿Cómo te fue?", "How did it go?")}</Label>
        <View style={{ flexDirection: "row", gap: space(2) }}>
          {ratings.map(([rating, emoji, es, en]) => {
            const active = value.rating === rating;
            return (
              <Pressable
                key={rating}
                accessibilityRole="button"
                accessibilityLabel={t(es, en)}
                accessibilityState={{ selected: active }}
                onPress={() => onChange({ ...value, rating })}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 4,
                  paddingVertical: space(2.5),
                  borderRadius: 14,
                  backgroundColor: active ? colors.primary : colors.secondary,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 10,
                    textAlign: "center",
                    fontWeight: "700",
                    color: active ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {t(es, en)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ResizableInput
        label={t("Comentario del entrenamiento", "Workout comment")}
        initialHeight={56}
        value={value.comment}
        onChangeText={(comment) => onChange({ ...value, comment })}
        onResizing={(resizing) => onResizing?.(resizing)}
      />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        {weightField(
          "bodyWeightStartKg",
          t("Peso corporal inicial", "Initial body weight"),
        )}
        {weightField(
          "bodyWeightEndKg",
          t("Peso corporal final", "Final body weight"),
        )}
      </View>
      <View style={{ gap: space(2) }}>
        <Label muted>
          {t("Fotos del entrenamiento (hasta 3)", "Workout photos (up to 3)")}
        </Label>
        <PhotoStrip
          photos={value.photos}
          onChange={(photos) => onChange({ ...value, photos })}
        />
      </View>
    </View>
  );
}
