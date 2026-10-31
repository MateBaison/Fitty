import { Image } from "expo-image";
import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from "react-native";
import { restartAccount } from "@fitty/core/domain/account-reset";
import { readSnapshotJson } from "@fitty/core/domain/legacy/read-snapshot";
import { menstrualCalendarAllowed } from "@fitty/core/domain/menstrual-calendar";
import { missingProfileFields } from "@fitty/core/domain/profile-validation";
import { localDateKey } from "@fitty/core/domain/workouts";
import { accountCacheKey } from "@fitty/core/storage/account-cache";
import { Notice } from "@/components/notice";
import { languageOptions } from "@/components/onboarding";
import {
  ProfileFields,
  profileDraft,
  profileValues,
} from "@/components/profile-fields";
import { DeleteAccount } from "@/components/delete-account";
import { LinkedApps } from "@/components/linked-apps";
import { SignOut } from "@/components/sign-out";
import { Button, Card, Field, Label, Screen } from "@/components/ui";
import { pickPhoto, safePhoto } from "@/lib/photos";
import { useAccount, useSnapshot } from "@/state/account";
import { useSession } from "@/state/session";
import { colors, space } from "@/theme";

const sectionTitle = {
  color: colors.foreground,
  fontSize: 20,
  fontWeight: "800" as const,
};

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: space(4),
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? colors.primary : colors.secondary,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.foreground,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ResetAccount() {
  const snapshot = useSnapshot();
  const { change, flush, view, t } = useAccount();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const apply = async () => {
    if (busy || confirmation !== "REINICIAR" || !session) return;
    setBusy(true);
    setError(false);
    try {
      if (!(await flush())) throw new Error("sync");
      // Same safety net as the web: keep a local copy before wiping the account.
      const key = `${accountCacheKey(session.user.id)}:reset-backup:${Date.now()}`;
      const raw = JSON.stringify(snapshot);
      localStorage.setItem(key, raw);
      if (localStorage.getItem(key) !== raw) throw new Error("backup");
      if (!change(restartAccount)) throw new Error("reset");
      if (!(await flush())) throw new Error("sync");
      setOpen(false);
      setConfirmation("");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
          setError(false);
        }}
      >
        {t("Reiniciar cuenta", "Reset account")}
      </Button>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!busy) setOpen(false); }}
      >
        <Pressable
          onPress={() => !busy && setOpen(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card>
              <Text style={{ ...sectionTitle, textAlign: "center" }}>
                {t("Reiniciar cuenta", "Reset account")}
              </Text>
              <Label muted>
                {t(
                  "Herramienta temporal de pruebas. Vacía el perfil, rutinas e historial y vuelve a la configuración inicial. Conserva tu correo y acceso. Antes se guardará una copia local.",
                  "Temporary testing tool. Clears your profile, routines and history and returns to initial setup. Keeps your email and sign-in. A local backup is saved first.",
                )}
              </Label>
              <Label>
                {t("Escribí REINICIAR para confirmar", "Type REINICIAR to confirm")}
              </Label>
              <TextField value={confirmation} onChange={setConfirmation} disabled={busy} />
              {error ? (
                <Label>
                  {t(
                    "No se pudo completar el reinicio. Revisá la sincronización y reintentá.",
                    "Reset could not be completed. Check sync and retry.",
                  )}
                </Label>
              ) : null}
              <View style={{ flexDirection: "row", gap: space(3) }}>
                <View style={{ flex: 1 }}>
                  <Button variant="secondary" disabled={busy} onPress={() => setOpen(false)}>
                    {t("Cancelar", "Cancel")}
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="destructive"
                    loading={busy}
                    disabled={confirmation !== "REINICIAR" || view.status !== "synced"}
                    onPress={() => void apply()}
                  >
                    {t("Confirmar reinicio", "Confirm reset")}
                  </Button>
                </View>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function TextField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field
      label=""
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      autoCapitalize="characters"
      autoCorrect={false}
    />
  );
}

export default function Profile() {
  const snapshot = useSnapshot();
  const { change, notify, retry, view, t } = useAccount();
  const { session } = useSession();
  const [draft, setDraft] = useState(() => profileDraft(snapshot.profile));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const [prefs, setPrefs] = useState({
    weight: snapshot.settings.weight ?? "kg",
    height: snapshot.settings.height ?? "cm",
    distance: snapshot.settings.distance ?? "km",
    language: snapshot.settings.language ?? "es",
  });
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
  const importBackup = async () => {
    if (!session) return;
    let picker: {
      getDocumentAsync: (options: object) => Promise<{
        canceled: boolean;
        assets?: { uri: string; size?: number }[];
      }>;
    };
    try {
      // The picker is a native module: a build made before it was added cannot open files.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      picker = require("expo-document-picker");
    } catch {
      notify(
        t(
          "Para importar hace falta actualizar la app con el último build.",
          "Importing needs the latest app build.",
        ),
      );
      return;
    }
    try {
      const result = await picker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      const asset = result.canceled ? undefined : result.assets?.[0];
      if (!asset) return;
      if ((asset.size ?? 0) > 25 * 1024 * 1024)
        return notify(t("La copia supera 25 MB.", "The backup is over 25 MB."));
      const read = readSnapshotJson(await (await fetch(asset.uri)).text());
      if (!read.ok)
        return notify(
          t(
            "La copia no es válida. No se reemplazó ningún dato.",
            "The backup is not valid. No data was replaced.",
          ),
        );
      Alert.alert(
        t("¿Reemplazar los datos?", "Replace the data?"),
        t(
          "Se reemplazarán los datos de esta cuenta con la copia. Se conservará una recuperación local de los datos actuales.",
          "This account's data will be replaced with the backup. A local recovery copy of the current data will be kept.",
        ),
        [
          { text: t("Cancelar", "Cancel"), style: "cancel" },
          {
            text: t("Reemplazar", "Replace"),
            style: "destructive",
            onPress: () => {
              try {
                localStorage.setItem(
                  `${accountCacheKey(session.user.id)}:import-backup:${Date.now()}`,
                  JSON.stringify(snapshot),
                );
              } catch {
                return notify(
                  t(
                    "No hay espacio para conservar la recuperación. No importamos datos.",
                    "Not enough space to keep the recovery copy. Nothing was imported.",
                  ),
                );
              }
              if (
                change((draft) => {
                  Object.keys(draft).forEach((key) => {
                    delete draft[key];
                  });
                  Object.assign(draft, read.snapshot);
                })
              )
                notify(t("Copia importada; sincronizando…", "Backup imported; syncing…"));
            },
          },
        ],
      );
    } catch {
      notify(t("No se pudo leer el archivo.", "Could not read the file."));
    }
  };
  const saveSettings = () => {
    const { weight, height, distance, language } = prefs;
    if (
      change((draft) => {
        if (weight !== (draft.settings.weight ?? "kg")) {
          const factor = weight === "lb" ? 2.20462 : 1 / 2.20462;
          draft.profile.weight =
            Math.round(Number(draft.profile.weight ?? 75) * factor * 10) / 10;
          draft.workout?.entries.forEach((entry) =>
            entry.sets.forEach((set) => {
              if (set.kg != null) set.kg = Math.round(set.kg * factor * 10) / 10;
            }),
          );
        }
        if (height !== (draft.settings.height ?? "cm"))
          draft.profile.height =
            Math.round(
              Number(draft.profile.height ?? 175) *
                (height === "ft" ? 1 / 30.48 : 30.48) *
                100,
            ) / 100;
        Object.assign(draft.settings, { weight, height, distance, language });
      })
    ) {
      setSettingsOpen(false);
      notify(t("Configuración guardada", "Settings saved"));
    }
  };
  return (
    <Screen>
      <Notice />
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={sectionTitle}>
            {t("Datos personales", "Personal details")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Configuración", "Settings")}
            onPress={() => {
              setPrefs({
                weight: settings.weight ?? "kg",
                height: settings.height ?? "cm",
                distance: settings.distance ?? "km",
                language: settings.language ?? "es",
              });
              setChoosingLanguage(false);
              setSettingsOpen(true);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 22 }}>⚙</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: "center", gap: space(3) }}>
          {safePhoto(snapshot.profile.photo) ? (
            <Image
              source={snapshot.profile.photo}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              accessibilityLabel={t("Foto de perfil", "Profile photo")}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2f7ba6",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 38, fontWeight: "800" }}>
                {(snapshot.profile.name?.trim()[0] ?? "F").toUpperCase()}
              </Text>
            </View>
          )}
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
              {t("Elegir foto", "Choose photo")}
            </Button>
            {snapshot.profile.photo ? (
              <Button
                variant="destructive"
                onPress={() => change((next) => void delete next.profile.photo)}
              >
                {t("Eliminar foto", "Remove photo")}
              </Button>
            ) : null}
          </View>
        </View>
        <ProfileFields
          value={draft}
          onChange={setDraft}
          email={session?.user.email ?? undefined}
        />
        {menstrualAllowed ? (
          <>
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
                accessibilityLabel={t("Calendario menstrual", "Menstrual calendar")}
                value={snapshot.profile.menstrualCalendar?.enabled === true}
                trackColor={{ true: "#22c55e", false: colors.border }}
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
                "Marcá los días en el calendario de Inicio. Antes de entrenar te preguntaremos cómo te sentís.",
                "Mark days on the Home calendar. Before training we'll ask how you feel.",
              )}
            </Label>
          </>
        ) : null}
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: linkedOpen }}
        onPress={() => setLinkedOpen((value) => !value)}
        style={{
          padding: space(4.5),
          borderRadius: 24,
          borderColor: colors.border,
          borderWidth: 1,
          backgroundColor: colors.card,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
          {t("Apps vinculadas", "Linked apps")}
        </Text>
        <Text style={{ color: colors.muted }}>{linkedOpen ? "▲" : "▼"}</Text>
      </Pressable>
      {linkedOpen ? <LinkedApps /> : null}
      <Card>
        <Text style={{ ...sectionTitle, fontSize: 17 }}>
          {t("Copia de tus datos", "Data backup")}
        </Text>
        <Label muted>
          {t(
            "La copia incluye perfil, historial y fotos. Guardala de forma privada.",
            "The backup includes your profile, history and photos. Store it privately.",
          )}
        </Label>
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
          {t("Exportar copia", "Export backup")}
        </Button>
        <Button variant="secondary" onPress={() => void importBackup()}>
          {t("Importar copia", "Import backup")}
        </Button>
      </Card>
      {view.status !== "synced" ? (
        <Card>
          <Text style={sectionTitle}>{t("Sincronización", "Sync")}</Text>
          <Label muted>{view.message}</Label>
          <Button variant="secondary" onPress={retry}>
            {t("Reintentar sincronización", "Retry sync")}
          </Button>
        </Card>
      ) : null}
      <ResetAccount />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            onPress={() =>
              void Linking.openURL(
                `https://fitty.uy/privacidad?lang=${settings.language ?? "es"}`,
              )
            }
          >
            {t("Política de privacidad", "Privacy policy")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <SignOut />
        </View>
      </View>
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable
          onPress={() => setSettingsOpen(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined} style={{ maxHeight: "90%" }}>
            <Card>
              <ScrollView
                contentContainerStyle={{ gap: space(3) }}
                keyboardShouldPersistTaps="handled"
              >
                {choosingLanguage ? (
                  <>
                    <Text style={{ ...sectionTitle, textAlign: "center" }}>
                      {t("Idioma", "Language")}
                    </Text>
                    {languageOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: prefs.language === option.value }}
                        onPress={() => {
                          setPrefs({ ...prefs, language: option.value });
                          setChoosingLanguage(false);
                        }}
                        style={{
                          minHeight: 52,
                          paddingHorizontal: space(4),
                          borderRadius: 14,
                          justifyContent: "center",
                          backgroundColor:
                            prefs.language === option.value ? "#173a52" : colors.secondary,
                          borderColor:
                            prefs.language === option.value ? colors.primary : colors.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                    <Button variant="secondary" onPress={() => setChoosingLanguage(false)}>
                      {t("Volver", "Back")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Text style={{ ...sectionTitle, textAlign: "center" }}>
                      {t("Configuración", "Settings")}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3) }}>
                      {(
                        [
                          ["weight", t("Peso", "Weight"), "kg", "lb"],
                          ["height", t("Altura", "Height"), "cm", "ft"],
                          ["distance", t("Distancia", "Distance"), "km", "mi"],
                        ] as const
                      ).map(([key, label, first, second]) => (
                        <View key={key} style={{ width: "47%", gap: space(2), alignItems: "center" }}>
                          <Text style={{ color: colors.muted, fontWeight: "800" }}>{label}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: space(2), minHeight: 52 }}>
                            <Text style={{ color: prefs[key] === first ? colors.foreground : colors.muted, fontWeight: "800" }}>
                              {first}
                            </Text>
                            <Switch
                              accessibilityLabel={label}
                              value={prefs[key] === second}
                              trackColor={{ true: colors.primary, false: colors.primary }}
                              onValueChange={(on) =>
                                setPrefs({ ...prefs, [key]: on ? second : first })
                              }
                            />
                            <Text style={{ color: prefs[key] === second ? colors.foreground : colors.muted, fontWeight: "800" }}>
                              {second}
                            </Text>
                          </View>
                        </View>
                      ))}
                      <View style={{ width: "47%", gap: space(2), alignItems: "center" }}>
                        <Text style={{ color: colors.muted, fontWeight: "800" }}>
                          {t("Idioma", "Language")}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setChoosingLanguage(true)}
                          style={{
                            minHeight: 52,
                            alignSelf: "stretch",
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: colors.secondary,
                            borderColor: colors.border,
                            borderWidth: 1,
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                            {languageOptions.find((option) => option.value === prefs.language)?.label ?? prefs.language} ▾
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <DeleteAccount />
                    <Button onPress={saveSettings}>
                      {t("Guardar configuración", "Save settings")}
                    </Button>
                    <Button variant="secondary" onPress={() => setSettingsOpen(false)}>
                      {t("Cerrar", "Close")}
                    </Button>
                  </>
                )}
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
