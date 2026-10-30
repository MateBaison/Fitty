import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
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
import {
  ProfileFields,
  profileDraft,
  profileValues,
} from "@/components/profile-fields";
import { Notice } from "@/components/notice";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { makeId } from "@/lib/id";
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

/** First-use flow: required profile details, then a starting routine. */
export function Onboarding() {
  const snapshot = useSnapshot();
  const { change, flush, notify, t } = useAccount();
  const { session } = useSession();
  const language = snapshot.settings.language ?? "es";
  const [step, setStep] = useState<"profile" | "training">("profile");
  const [profile, setProfile] = useState(() => profileDraft(snapshot.profile));
  const [experience, setExperience] = useState<TrainingExperience>("beginner");
  const [days, setDays] = useState(2);
  const [goal, setGoal] = useState<string>("Fuerza e hipertrofia");
  const [groups, setGroups] = useState<MuscleGroup[]>([...muscleGroups]);
  const [preview, setPreview] = useState<Routine | null>(null);
  const [variation, setVariation] = useState(0);
  const [busy, setBusy] = useState(false);
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
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Label muted>
          {t("Paso", "Step")} {step === "profile" ? 1 : 2} {t("de", "of")} 2
        </Label>
        <Title>
          {step === "profile"
            ? t("Tus datos", "Your details")
            : t("Tu entrenamiento", "Your training")}
        </Title>
        <Notice />
        {step === "profile" ? (
          <Card>
            <ChipGroup
              options={languageOptions}
              value={language}
              onChange={(code) =>
                change((draft) => void (draft.settings.language = code))
              }
            />
            <ProfileFields value={profile} onChange={setProfile} />
            <Button
              disabled={missing.length > 0}
              onPress={() => setStep("training")}
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
        ) : (
          <>
            <Card>
              <Label muted>{t("Experiencia", "Experience")}</Label>
              <ChipGroup
                options={experiences.map(([value, es, en]) => ({
                  value,
                  label: t(es, en),
                }))}
                value={experience}
                onChange={(value) => {
                  setExperience(value);
                  setDays(recommendedTrainingDays(value));
                  setPreview(null);
                }}
              />
              <Label muted>{t("Días por semana", "Days per week")}</Label>
              <ChipGroup
                options={[1, 2, 3, 4, 5, 6].map((value) => ({
                  value,
                  label: String(value),
                }))}
                value={days}
                onChange={(value) => {
                  setDays(value);
                  setPreview(null);
                }}
              />
              <Label muted>{t("Objetivo", "Goal")}</Label>
              <ChipGroup
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
              <Label muted>
                {t("Músculos a entrenar", "Muscles to train")}
              </Label>
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
            <Button
              variant="secondary"
              disabled={busy}
              onPress={() => void save("custom")}
            >
              {t(
                "Tengo una rutina: quiero armarla",
                "I have a routine: I'll build it",
              )}
            </Button>
            <Button variant="ghost" onPress={() => setStep("profile")}>
              {t("Volver", "Back")}
            </Button>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
