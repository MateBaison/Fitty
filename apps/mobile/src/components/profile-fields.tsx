import { View } from "react-native";
import { ChipGroup } from "@/components/chip";
import { Field, Label } from "@/components/ui";
import { useAccount } from "@/state/account";
import { space } from "@/theme";

export const genders = [
  ["hombre", "Hombre", "Male"],
  ["mujer", "Mujer", "Female"],
  ["no_binario", "No binario", "Non-binary"],
  ["otro", "Otro", "Other"],
] as const;

export type ProfileDraft = {
  name: string;
  birth: string;
  country: string;
  height: string;
  weight: string;
  gender: string;
};

export function profileDraft(profile: Record<string, unknown>): ProfileDraft {
  const text = (value: unknown) => (value == null ? "" : String(value));
  return {
    name: text(profile.name),
    birth: text(profile.birth),
    country: text(profile.country),
    height: text(profile.height),
    weight: text(profile.weight),
    gender: text(profile.gender),
  };
}

/** Normalized values ready for missingProfileFields and the snapshot. */
export function profileValues(draft: ProfileDraft) {
  return {
    ...draft,
    name: draft.name.trim(),
    country: draft.country.trim(),
    height: Number(draft.height.replace(",", ".")),
    weight: Number(draft.weight.replace(",", ".")),
  };
}

export function ProfileFields({
  value,
  onChange,
}: {
  value: ProfileDraft;
  onChange: (value: ProfileDraft) => void;
}) {
  const { t } = useAccount();
  const set = (field: keyof ProfileDraft) => (next: string) =>
    onChange({ ...value, [field]: next });
  return (
    <>
      <Field
        label={t("Nombre", "Name")}
        value={value.name}
        onChangeText={set("name")}
        maxLength={80}
        autoComplete="name"
      />
      <Field
        label={t("Fecha de nacimiento (AAAA-MM-DD)", "Birth date (YYYY-MM-DD)")}
        value={value.birth}
        onChangeText={set("birth")}
        placeholder="1995-04-21"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Field
        label={t("País", "Country")}
        value={value.country}
        onChangeText={set("country")}
        autoComplete="country"
      />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Field
            label={`${t("Altura", "Height")} (cm)`}
            value={value.height}
            onChangeText={set("height")}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label={`${t("Peso", "Weight")} (kg)`}
            value={value.weight}
            onChangeText={set("weight")}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Label muted>{t("Género", "Gender")}</Label>
      <ChipGroup
        options={genders.map(([gender, es, en]) => ({
          value: gender as string,
          label: t(es, en),
        }))}
        value={value.gender}
        onChange={set("gender")}
      />
    </>
  );
}
