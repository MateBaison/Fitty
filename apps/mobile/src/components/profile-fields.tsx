import { View } from "react-native";
import { localDateKey } from "@fitty/core/domain/workouts";
import { Dropdown } from "@/components/dropdown";
import {
  CountryField,
  DateField,
  MeasureField,
} from "@/components/pickers";
import { Field } from "@/components/ui";
import { useAccount } from "@/state/account";
import { space } from "@/theme";

export const genders = [
  ["undisclosed", "Prefiero no decirlo", "Prefer not to say"],
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
  email,
}: {
  value: ProfileDraft;
  onChange: (value: ProfileDraft) => void;
  /** Account e-mail, shown read-only like the web. */
  email?: string;
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
      {email ? (
        <Field
          label={t("Email de contacto", "Contact email")}
          value={email}
          editable={false}
          autoComplete="email"
        />
      ) : null}
      <DateField
        label={t("Fecha de nacimiento", "Birth date")}
        value={value.birth}
        onChange={set("birth")}
        max={localDateKey(new Date())}
      />
      <CountryField
        label={t("País", "Country")}
        value={value.country}
        onChange={set("country")}
      />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <MeasureField
            kind="height"
            label={t("Altura", "Height")}
            value={value.height}
            onChange={set("height")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MeasureField
            kind="weight"
            label={t("Peso", "Weight")}
            value={value.weight}
            onChange={set("weight")}
          />
        </View>
      </View>
      <Dropdown
        label={t("Género", "Gender")}
        placeholder={t("Seleccioná una opción", "Select an option")}
        options={genders.map(([gender, es, en]) => ({
          value: gender as string,
          label: t(es, en),
        }))}
        value={value.gender || null}
        onChange={set("gender")}
      />
    </>
  );
}
