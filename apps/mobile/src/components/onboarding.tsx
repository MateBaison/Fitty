import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import { colors, space } from "@/theme";
import { languages } from "@fitty/core/data/translations";
import {
  muscleGroups,
  type MuscleGroup,
} from "@fitty/core/domain/schemas/exercise";
import type { Routine } from "@fitty/core/domain/schemas/snapshot";
import { missingProfileFields } from "@fitty/core/domain/profile-validation";
import {
  createGuidedRoutine,
  recommendedTrainingDays,
  type TrainingExperience,
} from "@fitty/core/domain/training-setup";
import { translate } from "@fitty/core/data/translations";
import { localDateKey } from "@fitty/core/domain/workouts";
import { ChipGroup } from "@/components/chip";
import { BackButton } from "@/components/back-button";
import { Dropdown } from "@/components/dropdown";
import {
  ProfileFields,
  profileDraft,
  profileValues,
} from "@/components/profile-fields";
import { menstrualCalendarAllowed } from "@fitty/core/domain/menstrual-calendar";
import { MenstrualDays } from "@/components/menstrual-days";
import { Notice } from "@/components/notice";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { makeId } from "@/lib/id";
import { queryClient, queryPersister } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useAccount, useSnapshot } from "@/state/account";
import { useSession } from "@/state/session";

export const goals = [
  ["Fuerza e hipertrofia", "Strength and hypertrophy"],
  ["Baja grasa corporal", "Lose body fat"],
  ["Ganar masa corporal", "Gain body mass"],
  ["Mejorar resistencia cardiovascular", "Improve cardiovascular endurance"],
] as const;
const experiences = [
  ["beginner", "Estoy empezando", "I'm starting out"],
  ["returning", "Vuelvo a entrenar", "I'm getting back into it"],
  ["regular", "Entreno seguido", "I train regularly"],
  ["experienced", "Tengo experiencia", "I'm experienced"],
] as const;
const languageNames: Record<string, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};
export const languageOptions = languages.map((code) => ({
  value: code as string,
  label: languageNames[code] ?? code,
}));

/** Two-step progress bar, same look as the web account setup. */
function SetupProgress({ step }: { step: 1 | 2 }) {
  const { t } = useAccount();
  const steps = [
    t("Tus datos", "Your details"),
    t("Tu rutina", "Your routine"),
  ];
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t(
        "Progreso de creación de cuenta",
        "Account setup progress",
      )}
      accessibilityValue={{ min: 0, max: 2, now: step }}
      style={{ gap: space(3) }}
    >
      <View
        style={{
          height: 6,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: colors.secondary,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${step * 50}%`,
            borderRadius: 999,
            backgroundColor: colors.primary,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < step;
          const current = number === step;
          return (
            <View
              key={label}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: done || current ? colors.primary : colors.border,
                  backgroundColor: done ? colors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: done
                      ? colors.background
                      : current
                        ? colors.primary
                        : colors.muted,
                  }}
                >
                  {done ? "✓" : number}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  fontSize: 13,
                  fontWeight: "600",
                  color: done || current ? colors.foreground : colors.muted,
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** First-use flow: required profile details, then a starting routine. */
export function Onboarding() {
  const snapshot = useSnapshot();
  const { change, flush, notify, t } = useAccount();
  const { session } = useSession();
  const language = snapshot.settings.language ?? "es";
  const [step, setStep] = useState<"profile" | "choice" | "training">("profile");
  const [profile, setProfile] = useState(() => profileDraft(snapshot.profile));
  const [experience, setExperience] = useState<TrainingExperience>("beginner");
  const [days, setDays] = useState(2);
  const [goal, setGoal] = useState<string>("Fuerza e hipertrofia");
  const [groups, setGroups] = useState<MuscleGroup[]>([...muscleGroups]);
  const [preview, setPreview] = useState<Routine | null>(null);
  const [variation, setVariation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"custom" | "auto">("custom");
  const [menstrual, setMenstrual] = useState(false);
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const menstrualAllowed = menstrualCalendarAllowed({ gender: profile.gender });
  const values = profileValues(profile);
  const missing = missingProfileFields(values, localDateKey(new Date()));
  const proposal = (next: number) =>
    createGuidedRoutine(
      { mode: "auto", experience, days, goal, groups, variation: next },
      { makeId, language },
    );
  const save = async (mode: "auto" | "custom") => {
    if (busy) return;
    setBusy(true);
    try {
      const routine =
        mode === "auto"
          ? (preview ?? proposal(variation))
          : createGuidedRoutine(
              {
                mode: "custom",
                experience,
                days,
                goal,
                groups: [],
                variation: 0,
              },
              { makeId, language },
            );
      const saved = change((draft) => {
        draft.profile = {
          ...draft.profile,
          ...values,
          email: session?.user.email,
          onboardingComplete: true,
          ...(menstrualAllowed
            ? {
                menstrualCalendar: {
                  ...draft.profile.menstrualCalendar,
                  enabled: menstrual,
                  ...(periodDates.length ? { dates: periodDates } : {}),
                },
              }
            : {}),
          ...(mode === "auto"
            ? { trainingExperience: experience, trainingGoal: goal }
            : {}),
        };
        draft.routines.push(routine);
        draft.selected = routine.id;
      });
      if (saved && !(await flush()))
        notify(
          t(
            "Guardado en este teléfono; falta sincronizar.",
            "Saved on this phone; sync is pending.",
          ),
        );
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => {
    if (step === "training") {
      setStep("choice");
      return;
    }
    if (step === "choice") {
      setStep("profile");
      return;
    }
    Alert.alert(
      t("¿Cancelar la creación de la cuenta?", "Cancel account setup?"),
      t(
        "Vas a volver a la pantalla de inicio de sesión.",
        "You'll go back to the sign-in screen.",
      ),
      [
        { text: t("Seguir aquí", "Stay here"), style: "cancel" },
        {
          text: t("Cancelar creación", "Cancel setup"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await supabase.auth.signOut();
              queryClient.clear();
              await queryPersister.removeClient();
            })();
          },
        },
      ],
    );
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View style={{ justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 0, zIndex: 1 }}>
            <BackButton onPress={cancel} />
          </View>
          <Title center>
            {step === "profile"
              ? t("Tus datos", "Your details")
              : t("Tu rutina", "Your routine")}
          </Title>
        </View>
        <SetupProgress step={step === "profile" ? 1 : 2} />
        <Notice />
        {step === "profile" ? (
          <Card>
            <ProfileFields value={profile} onChange={setProfile} />
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
                    accessibilityLabel={t(
                      "Calendario menstrual",
                      "Menstrual calendar",
                    )}
                    value={menstrual}
                    trackColor={{ true: "#22c55e", false: colors.border }}
                    onValueChange={setMenstrual}
                  />
                </View>
                {menstrual ? (
                  <MenstrualDays
                    dates={periodDates}
                    onChange={setPeriodDates}
                    locale={language}
                  />
                ) : null}
              </>
            ) : null}
            <Button
              disabled={missing.length > 0}
              onPress={() => setStep("choice")}
            >
              {t("Continuar", "Continue")}
            </Button>
            {missing.length ? (
              <Label muted>
                {t(
                  "Completá todos los campos para continuar.",
                  "Fill in every field to continue.",
                )}
              </Label>
            ) : null}
          </Card>
        ) : step === "choice" ? (
          <Card>
            <Label muted>
              {t(
                "Elegí cómo querés empezar. Podés cambiar tu rutina más adelante.",
                "Choose how you want to start. You can change your routine later.",
              )}
            </Label>
            {(
              [
                [
                  "custom",
                  t("Armar mi rutina después", "Build my routine later"),
                  t(
                    "Entrá a Fitty y creala desde Inicio cuando quieras.",
                    "Go to Fitty and create one from Home whenever you are ready.",
                  ),
                ],
                [
                  "auto",
                  t("Crear una rutina sugerida", "Create a suggested routine"),
                  t(
                    "Fitty te propone una base según tu experiencia, tus días y tu objetivo.",
                    "Fitty suggests a starting plan based on your experience, days and goal.",
                  ),
                ],
              ] as const
            ).map(([value, title, description]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === value }}
                onPress={() => setMode(value)}
                style={{
                  padding: space(4),
                  gap: 4,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: mode === value ? colors.primary : colors.border,
                  backgroundColor:
                    mode === value ? "#173a52" : colors.secondary,
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  {description}
                </Text>
              </Pressable>
            ))}
            <Button
              loading={busy}
              onPress={() =>
                mode === "custom" ? void save("custom") : setStep("training")
              }
            >
              {t("Continuar", "Continue")}
            </Button>
          </Card>
        ) : (
          <>
            <Card>
              <Dropdown
                label={t("Experiencia", "Experience")}
                options={experiences.map(([value, es, en]) => ({
                  value: value as TrainingExperience,
                  label: t(es, en),
                }))}
                value={experience}
                onChange={(value) => {
                  setExperience(value);
                  setDays(recommendedTrainingDays(value));
                  setPreview(null);
                }}
              />
              <Dropdown
                label={t("Días por semana", "Days per week")}
                options={[1, 2, 3, 4, 5, 6, 7].map((value) => ({
                  value,
                  label: String(value),
                }))}
                value={days}
                onChange={(value) => {
                  setDays(value);
                  setPreview(null);
                }}
              />
              <Dropdown
                label={t("Objetivo", "Goal")}
                options={goals.map(([value, en]) => ({
                  value,
                  label: t(value, en),
                }))}
                value={goal}
                onChange={(value) => {
                  setGoal(value);
                  setPreview(null);
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space(2),
                }}
              >
                <Label muted>
                  {t("Músculos a entrenar", "Muscles to train")}
                </Label>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setGroups(
                      groups.length === muscleGroups.length
                        ? []
                        : [...muscleGroups],
                    );
                    setPreview(null);
                  }}
                  style={{
                    minHeight: 40,
                    paddingHorizontal: space(3),
                    borderRadius: 12,
                    justifyContent: "center",
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                    {groups.length === muscleGroups.length
                      ? t("Deseleccionar todo", "Deselect all")
                      : t("Seleccionar todo", "Select all")}
                  </Text>
                </Pressable>
              </View>
              <ChipGroup
                multiple
                options={muscleGroups.map((group) => ({
                  value: group,
                  label: translate(language, group, group),
                }))}
                value={groups}
                onChange={(group) => {
                  setGroups((current) =>
                    current.includes(group)
                      ? current.filter((item) => item !== group)
                      : [...current, group],
                  );
                  setPreview(null);
                }}
              />
              <Button
                variant="secondary"
                disabled={!groups.length}
                onPress={() => {
                  setPreview(proposal(variation));
                  setVariation((current) => current + 1);
                }}
              >
                {preview
                  ? t("Proponer otra rutina", "Suggest another routine")
                  : t("Ver rutina propuesta", "See suggested routine")}
              </Button>
            </Card>
            {preview ? (
              <Card>
                <Label>{preview.name}</Label>
                {preview.days.map((day) => (
                  <Label muted key={day.id}>
                    {day.name}: {day.items.length}{" "}
                    {t("ejercicios", "exercises")}
                  </Label>
                ))}
              </Card>
            ) : null}
            <Button
              loading={busy}
              disabled={!groups.length}
              onPress={() => void save("auto")}
            >
              {t("Usar rutina automática", "Use automatic routine")}
            </Button>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
