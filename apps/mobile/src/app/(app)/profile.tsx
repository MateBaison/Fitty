import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Share, Switch, View } from "react-native";
import { menstrualCalendarAllowed } from "@fitty/core/domain/menstrual-calendar";
import { missingProfileFields } from "@fitty/core/domain/profile-validation";
import { localDateKey } from "@fitty/core/domain/workouts";
import { ChipGroup } from "@/components/chip";
import { Notice } from "@/components/notice";
import { languageOptions } from "@/components/onboarding";
import {
  ProfileFields,
  profileDraft,
  profileValues,
} from "@/components/profile-fields";
import { DeleteAccount } from "@/components/delete-account";
import { LinkedApps } from "@/components/linked-apps";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { pickPhoto, safePhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabase";
import { useAccount, useSnapshot } from "@/state/account";
import { useSession } from "@/state/session";
import { colors, space } from "@/theme";

export default function Profile() {
  const snapshot = useSnapshot();
  const { change, flush, notify, t } = useAccount();
  const { session } = useSession();
  const [draft, setDraft] = useState(() => profileDraft(snapshot.profile));
  const values = profileValues(draft);
  const missing = missingProfileFields(values, localDateKey(new Date()));
  const changed =
    JSON.stringify(draft) !== JSON.stringify(profileDraft(snapshot.profile));
  const settings = snapshot.settings;
  // Masculine profiles hide menstrual controls but keep saved dates and settings.
  const menstrualAllowed = menstrualCalendarAllowed({
    ...snapshot.profile,
    gender: draft.gender,
  });
  return (
    <Screen>
      <Title>{snapshot.profile.name?.trim() || t("Perfil", "Profile")}</Title>
      <Card>
        {safePhoto(snapshot.profile.photo) ? (
          <Image
            source={snapshot.profile.photo}
            style={{ width: 96, height: 96, borderRadius: 48 }}
            accessibilityLabel={t("Foto de perfil", "Profile photo")}
          />
        ) : null}
        <View style={{ flexDirection: "row", gap: space(2) }}>
          <Button
            variant="secondary"
            onPress={async () => {
              try {
                const photo = await pickPhoto(1200);
                if (photo) change((next) => void (next.profile.photo = photo));
              } catch (error) {
                notify(error instanceof Error ? error.message : String(error));
              }
            }}
          >
            {t("Cambiar foto", "Change photo")}
          </Button>
          {snapshot.profile.photo ? (
            <Button
              variant="ghost"
              onPress={() => change((next) => void delete next.profile.photo)}
            >
              {t("Quitar foto", "Remove photo")}
            </Button>
          ) : null}
        </View>
        <Label muted>{session?.user.email}</Label>
        <SyncStatus />
      </Card>
      <Notice />
      <Card>
        <Label muted>{t("Tus datos", "Your details")}</Label>
        <ProfileFields value={draft} onChange={setDraft} />
        <Button
          disabled={!changed || missing.length > 0}
          onPress={() => {
            // Only changed fields are written, preserving historical formats.
            const original = profileDraft(snapshot.profile);
            if (
              change((next) => {
                for (const key of Object.keys(draft) as (keyof typeof draft)[])
                  if (draft[key] !== original[key])
                    Object.assign(next.profile, { [key]: values[key] });
              })
            )
              notify(t("Perfil guardado", "Profile saved"));
          }}
        >
          {t("Guardar cambios", "Save changes")}
        </Button>
      </Card>
      {menstrualAllowed ? (
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space(3),
            }}
          >
            <Label style={{ flex: 1 }}>
              {t("Calendario menstrual", "Menstrual calendar")}
            </Label>
            <Switch
              accessibilityLabel={t(
                "Calendario menstrual",
                "Menstrual calendar",
              )}
              value={snapshot.profile.menstrualCalendar?.enabled === true}
              trackColor={{ true: colors.primary, false: colors.secondary }}
              onValueChange={(enabled) =>
                void change((next) => {
                  next.profile.menstrualCalendar = {
                    ...next.profile.menstrualCalendar,
                    enabled,
                  };
                })
              }
            />
          </View>
          <Label muted>
            {t(
              "Marcá los días en el calendario de Progreso. Antes de entrenar te preguntaremos cómo te sentís.",
              "Mark days on the Progress calendar. Before training we'll ask how you feel.",
            )}
          </Label>
        </Card>
      ) : null}
      <Label>{t("Configuración", "Settings")}</Label>
      <Card>
        <Label muted>{t("Idioma", "Language")}</Label>
        <ChipGroup
          options={languageOptions}
          value={settings.language ?? "es"}
          onChange={(code) =>
            change((next) => void (next.settings.language = code))
          }
        />
        <Label muted>{t("Unidad de peso", "Weight unit")}</Label>
        <ChipGroup
          options={[
            { value: "kg", label: "kg" },
            { value: "lb", label: "lb" },
          ]}
          value={settings.weight ?? "kg"}
          onChange={(weight) =>
            change((next) => void (next.settings.weight = weight))
          }
        />
        <Label muted>{t("Descanso entre series", "Rest between sets")}</Label>
        <ChipGroup
          options={[30, 60, 90, 120, 180].map((value) => ({
            value,
            label: `${value}s`,
          }))}
          value={Number(settings.restSeconds) || 60}
          onChange={(restSeconds) =>
            change((next) => void (next.settings.restSeconds = restSeconds))
          }
        />
      </Card>
      <LinkedApps />
      <Button
        variant="secondary"
        onPress={() => void Linking.openURL("https://fitty.uy/privacidad")}
      >
        {t("Política de privacidad", "Privacy policy")}
      </Button>
      <DeleteAccount />
      <Button
        variant="secondary"
        onPress={() =>
          // Full exports contain private records; the system share sheet lets the user choose where.
          void Share.share({
            title: "fitty-datos.json",
            message: JSON.stringify(snapshot),
          })
        }
      >
        {t("Exportar mis datos", "Export my data")}
      </Button>
      <Button
        variant="secondary"
        onPress={async () => {
          await flush();
          await supabase.auth.signOut();
        }}
      >
        {t("Cerrar sesión", "Sign out")}
      </Button>
    </Screen>
  );
}
