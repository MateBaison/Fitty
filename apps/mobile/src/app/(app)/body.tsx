import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { bodyMeasurementInputSchema } from "@fitty/core/domain/schemas/snapshot";
import { localDateKey } from "@fitty/core/domain/workouts";
import { Notice } from "@/components/notice";
import { PhotoStrip } from "@/components/photo-strip";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { makeId } from "@/lib/id";
import { safePhoto } from "@/lib/photos";
import { useAccount, useSnapshot } from "@/state/account";
import { space } from "@/theme";

const fields = [
  ["weightKg", "Peso", "Weight"],
  ["waistCm", "Cintura", "Waist"],
  ["hipsCm", "Cadera", "Hips"],
  ["chestCm", "Pecho", "Chest"],
  ["armCm", "Brazo", "Arm"],
  ["thighCm", "Muslo", "Thigh"],
] as const;
type FieldKey = (typeof fields)[number][0];
const KG_TO_LB = 2.20462;

export function BodyPanel() {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const router = useRouter();
  const unit = snapshot.settings.weight ?? "kg";
  const factor = unit === "lb" ? KG_TO_LB : 1;
  const locale = snapshot.settings.language ?? "es";
  const [date, setDate] = useState(localDateKey(new Date()));
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const measurements = [...(snapshot.bodyMeasurements ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const label = (key: FieldKey, es: string, en: string) =>
    `${t(es, en)} (${key === "weightKg" ? unit : "cm"})`;
  const save = () => {
    const input: Record<string, unknown> = {
      id: makeId(),
      date,
      ...(photo ? { photo } : {}),
    };
    for (const [key] of fields) {
      const raw = (values[key] ?? "").replace(",", ".").trim();
      if (raw) input[key] = Number(raw) / (key === "weightKg" ? factor : 1);
    }
    const parsed = bodyMeasurementInputSchema.safeParse(input);
    if (!parsed.success)
      return notify(
        t(
          "Revisá la fecha y agregá una medida válida.",
          "Check the date and add a valid measurement.",
        ),
      );
    if (
      change((draft) => void (draft.bodyMeasurements ??= []).push(parsed.data))
    ) {
      setValues({});
      setPhoto(null);
      notify(t("Registro guardado", "Entry saved"));
    }
  };
  return (
    <>
      <Title>{t("Medidas corporales", "Body measurements")}</Title>
      <Notice />
      <Card>
        <Field
          label={t("Fecha (AAAA-MM-DD)", "Date (YYYY-MM-DD)")}
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3) }}>
          {fields.map(([key, es, en]) => (
            <View key={key} style={{ width: "47%" }}>
              <Field
                label={label(key, es, en)}
                value={values[key] ?? ""}
                onChangeText={(value) =>
                  setValues((current) => ({ ...current, [key]: value }))
                }
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>
        <PhotoStrip
          max={1}
          photos={photo ? [photo] : []}
          onChange={(next) => setPhoto(next[0] ?? null)}
        />
        <Button onPress={save}>{t("Guardar registro", "Save entry")}</Button>
      </Card>
      {measurements.map((measurement) => (
        <Card key={measurement.id}>
          <Label>
            {new Date(`${measurement.date}T12:00:00`).toLocaleDateString(
              locale,
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              },
            )}
          </Label>
          <Label muted>
            {fields
              .filter(([key]) => measurement[key] != null)
              .map(([key, es, en]) => {
                const value =
                  Number(measurement[key]) * (key === "weightKg" ? factor : 1);
                return `${t(es, en)}: ${Math.round(value * 10) / 10} ${key === "weightKg" ? unit : "cm"}`;
              })
              .join(" · ") || t("Foto", "Photo")}
          </Label>
          {safePhoto(measurement.photo) ? (
            <Image
              source={measurement.photo}
              style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12 }}
              contentFit="cover"
              accessibilityLabel={t("Foto de progreso", "Progress photo")}
            />
          ) : null}
          <Button
            variant="secondary"
            onPress={() =>
              Alert.alert(
                t("¿Eliminar registro?", "Delete entry?"),
                undefined,
                [
                  { text: t("Cancelar", "Cancel"), style: "cancel" },
                  {
                    text: t("Eliminar", "Delete"),
                    style: "destructive",
                    onPress: () =>
                      change((draft) => {
                        draft.bodyMeasurements = draft.bodyMeasurements?.filter(
                          (item) => item.id !== measurement.id,
                        );
                      }),
                  },
                ],
              )
            }
          >
            {t("Eliminar", "Delete")}
          </Button>
        </Card>
      ))}
    </>
  );
}

export default function Body() {
  const router = useRouter();
  const { t } = useAccount();
  return (
    <Screen>
      <Button variant="secondary" onPress={() => router.back()}>
        {`‹ ${t("Volver", "Back")}`}
      </Button>
      <BodyPanel />
    </Screen>
  );
}
