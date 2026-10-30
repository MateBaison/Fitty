"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/state/app-provider";
import type { Snapshot } from "@/domain/schemas/snapshot";
import { muscleGroups, type MuscleGroup } from "@/domain/schemas/exercise";
import {
  createGuidedRoutine,
  recommendedTrainingDays,
  type TrainingExperience,
} from "@/domain/training-setup";
import { PersonalForm } from "@/features/profile/personal-form";
import { Button } from "@/components/ui/button";
export function OnboardingFlow() {
  const { snapshot, change, flush, notify, t, user } = useApp();
  const router = useRouter();
  const [profile, setProfile] = useState<Snapshot["profile"]>(snapshot.profile);
  const [step, setStep] = useState<"profile" | "training">(
    snapshot.profile.onboardingComplete ? "training" : "profile",
  );
  const [configuring, setConfiguring] = useState(false);
  const [mode, setMode] = useState<"custom" | "auto">("custom");
  const [experience, setExperience] = useState<TrainingExperience>("beginner");
  const [days, setDays] = useState(2);
  const [goal, setGoal] = useState("Mejorar condición física");
  const [groups, setGroups] = useState<MuscleGroup[]>([...muscleGroups]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(
    snapshot.profile.onboardingComplete === true,
  );
  const currentStep = step === "profile" ? 1 : 2;
  const stepDescription =
    step === "profile"
      ? t("Tus datos", "Your details")
      : t("Tu entrenamiento", "Your training");
  const save = async (selectedMode = mode) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!pending) {
        const routine =
          selectedMode === "auto"
            ? createGuidedRoutine(
                { mode: selectedMode, experience, days, goal, groups },
                {
                  makeId: () => crypto.randomUUID(),
                  language: snapshot.settings.language ?? "es",
                },
              )
            : null;
        if (
          !change((draft) => {
            draft.profile = {
              ...draft.profile,
              ...profile,
              email: user.email,
              onboardingComplete: true,
              ...(selectedMode === "auto"
                ? { trainingExperience: experience, trainingGoal: goal }
                : {}),
            };
            if (routine) {
              draft.routines.push(routine);
              draft.selected = routine.id;
            }
          })
        )
          return;
        setPending(true);
      }
      if (await flush()) {
        router.replace("/home");
        router.refresh();
      } else
        notify(
          t(
            "Guardado en este dispositivo; falta sincronizar.",
            "Saved on this device; sync is pending.",
          ),
        );
    } catch {
      notify(
        t("Revisá los datos de tu rutina.", "Check your routine details."),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <h1 className="-translate-y-1 mb-5 text-center text-2xl font-bold">
        {step === "profile"
          ? t("Crear tu perfil", "Create your profile")
          : t("¿Cómo querés empezar?", "How would you like to start?")}
      </h1>
      <div className="onboarding-progress">
        <div
          className="onboarding-progress-track"
          role="progressbar"
          aria-label={t(
            "Progreso de creación de cuenta",
            "Account setup progress",
          )}
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={currentStep}
          aria-valuetext={stepDescription}
        >
          <span style={{ width: `${currentStep * 50}%` }} />
        </div>
        <ol
          className="onboarding-progress-steps"
          aria-label={t("Pasos del registro", "Setup steps")}
        >
          <li
            data-state={step === "profile" ? "current" : "complete"}
            aria-current={step === "profile" ? "step" : undefined}
          >
            <span className="onboarding-progress-marker" aria-hidden="true">
              {step === "profile" ? "1" : "✓"}
            </span>
            <span>{t("Tus datos", "Your details")}</span>
          </li>
          <li
            data-state={step === "training" ? "current" : "upcoming"}
            aria-current={step === "training" ? "step" : undefined}
          >
            <span className="onboarding-progress-marker" aria-hidden="true">
              2
            </span>
            <span>{t("Tu entrenamiento", "Your training")}</span>
          </li>
        </ol>
      </div>
      {step === "profile" ? (
        <PersonalForm
          onboarding
          initialProfile={profile}
          onContinue={(value) => {
            setProfile(value);
            setStep("training");
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending && mode === "auto" && !configuring) {
              setConfiguring(true);
              return;
            }
            void save();
          }}
        >
          <fieldset disabled={busy || pending} className="space-y-4">
            <legend className="sr-only">
              {t("Tu entrenamiento", "Your training")}
            </legend>
            {!configuring && (
              <>
                <p className="onboarding-intro">
                  {t(
                    "Elegí cómo querés empezar. Podés cambiar tu rutina más adelante.",
                    "Choose how you want to start. You can change your routine later.",
                  )}
                </p>
                <div className="onboarding-choices">
                  <Button
                    type="button"
                    className="onboarding-choice-card"
                    variant={mode === "custom" ? "default" : "secondary"}
                    aria-pressed={mode === "custom"}
                    onClick={() => {
                      setMode("custom");
                    }}
                  >
                    <span className="onboarding-choice-title">
                      {t("Armar mi rutina después", "Build my routine later")}
                    </span>
                    <span className="onboarding-choice-description">
                      {t(
                        "Entrá a Fitty y creala desde Inicio cuando quieras.",
                        "Go to Fitty and create one from Home whenever you are ready.",
                      )}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    className="onboarding-choice-card"
                    variant={mode === "auto" ? "default" : "secondary"}
                    aria-pressed={mode === "auto"}
                    onClick={() => setMode("auto")}
                  >
                    <span className="onboarding-choice-title">
                      {t(
                        "Crear una rutina sugerida",
                        "Create a suggested routine",
                      )}
                    </span>
                    <span className="onboarding-choice-description">
                      {t(
                        "Fitty te propone una base según tu experiencia, tus días y tu objetivo.",
                        "Fitty suggests a starting plan based on your experience, days and goal.",
                      )}
                    </span>
                  </Button>
                </div>
              </>
            )}
            {mode === "auto" && configuring && (
              <>
                <label className="block">
                  {t("Experiencia previa", "Previous experience")}
                  <select
                    value={experience}
                    onChange={(event) => {
                      const value = event.target.value as TrainingExperience;
                      setExperience(value);
                      setDays(recommendedTrainingDays(value));
                    }}
                  >
                    <option value="beginner">
                      {t("Estoy empezando", "I am starting out")}
                    </option>
                    <option value="returning">
                      {t(
                        "Estoy retomando después de una pausa",
                        "I am returning after a break",
                      )}
                    </option>
                    <option value="regular">
                      {t("Entreno con regularidad", "I train regularly")}
                    </option>
                    <option value="experienced">
                      {t(
                        "Tengo experiencia y una rutina sostenida",
                        "I have experience and a consistent routine",
                      )}
                    </option>
                  </select>
                </label>
                <p className="onboarding-suggestion" role="status">
                  {t("Punto de partida sugerido", "Suggested starting point")}:{" "}
                  <strong>
                    {recommendedTrainingDays(experience)}{" "}
                    {t("días por semana", "days per week")}
                  </strong>
                  .{" "}
                  {t(
                    "Podés ajustarlo a tu disponibilidad y recuperación; más días no siempre es mejor.",
                    "Adjust it to your availability and recovery; more days is not always better.",
                  )}
                </p>
                <label className="block">
                  {t(
                    "Días de entrenamiento por semana",
                    "Training days per week",
                  )}
                  <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  {t("Objetivo", "Goal")}
                  <select
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  >
                    {[
                      ["Mejorar condición física", "Improve fitness"],
                      ["Ganar masa muscular", "Build muscle"],
                      ["Fuerza e hipertrofia", "Strength and hypertrophy"],
                    ].map(([es, en]) => (
                      <option key={es} value={es}>
                        {t(es!, en!)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>
                    {t(
                      "Zonas que querés entrenar",
                      "Muscle groups you want to train",
                    )}
                  </legend>
                  <div className="onboarding-groups">
                    <label>
                      <input
                        type="checkbox"
                        checked={muscleGroups.every((group) =>
                          groups.includes(group),
                        )}
                        onChange={(event) =>
                          setGroups(
                            event.target.checked ? [...muscleGroups] : [],
                          )
                        }
                      />
                      {t("Todo", "All")}
                    </label>
                    {muscleGroups.map((group) => (
                      <label key={group}>
                        <input
                          type="checkbox"
                          checked={groups.includes(group)}
                          onChange={(event) =>
                            setGroups((current) =>
                              event.target.checked
                                ? [...current, group]
                                : current.filter((value) => value !== group),
                            )
                          }
                        />
                        {t(group, group)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Es una propuesta general de organización, no una evaluación médica ni un plan individual de rehabilitación.",
                    "This is a general organizational suggestion, not a medical assessment or an individual rehabilitation plan.",
                  )}
                </p>
              </>
            )}
          </fieldset>
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || pending}
              onClick={() =>
                configuring ? setConfiguring(false) : setStep("profile")
              }
            >
              {t("Volver", "Back")}
            </Button>
            <Button
              type="submit"
              disabled={busy || (configuring && !groups.length)}
            >
              {busy
                ? t("Guardando…", "Saving…")
                : pending
                  ? t("Reintentar sincronización", "Retry sync")
                  : configuring
                    ? t("Crear rutina y entrar", "Create routine and enter")
                    : mode === "auto"
                      ? t("Configurar rutina", "Set up routine")
                      : t("Entrar a Fitty", "Go to Fitty")}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
