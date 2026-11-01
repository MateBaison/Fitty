"use client";

import { shortExerciseName as short } from "@fitty/core/data/exercise-name";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/state/app-provider";
import type { Routine, Snapshot } from "@fitty/core/domain/schemas/snapshot";
import { muscleGroups, type MuscleGroup } from "@fitty/core/domain/schemas/exercise";
import { availableExercises } from "@fitty/core/data/exercises";
import {
  createGuidedRoutine,
  recommendedTrainingDays,
  type TrainingExperience,
} from "@fitty/core/domain/training-setup";
import { PersonalForm } from "@/features/profile/personal-form";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ExerciseVisual } from "@/features/exercises/exercise-visual";
import { ExerciseDetails } from "@/features/exercises/exercise-details";
import { ExercisePicker } from "@/features/exercises/exercise-picker";
import { localeFor } from "@fitty/core/data/translations";
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
  const [goal, setGoal] = useState("Fuerza e hipertrofia");
  const [groups, setGroups] = useState<MuscleGroup[]>([...muscleGroups]);
  const [previewRoutine, setPreviewRoutine] = useState<Routine | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [previewImageExercise, setPreviewImageExercise] = useState<(typeof availableExercises)[number] | null>(null);
  const [pickingForDayId, setPickingForDayId] = useState<string | null>(null);
  const [variation, setVariation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(
    snapshot.profile.onboardingComplete === true,
  );
  const currentStep = step === "profile" ? 1 : 2;
  const stepDescription =
    step === "profile"
      ? t("Tus datos", "Your details")
      : t("Tu entrenamiento", "Your training");
  const makeRoutineProposal = (nextVariation: number) => {
    const routine = createGuidedRoutine(
      {
        mode: "auto",
        experience,
        days,
        goal,
        groups,
        variation: nextVariation,
      },
      {
        makeId: () => crypto.randomUUID(),
        language: snapshot.settings.language ?? "es",
      },
    );
    // The muscle groups of each day are already listed under its name.
    return {
      ...routine,
      days: routine.days.map((day, index) => ({
        ...day,
        name: `${t("Día", "Day")} ${index + 1}`,
      })),
    };
  };
  const showRoutinePreview = () => {
    setPreviewRoutine(makeRoutineProposal(variation));
    setVariation((current) => current + 1);
    window.scrollTo(0, 0);
  };
  const save = async (selectedMode = mode) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!pending) {
        let preferredLanguage: string | null = null;
        try {
          const storedLanguage = localStorage.getItem("fitty-language");
          if (storedLanguage) preferredLanguage = localeFor(storedLanguage);
        } catch {
          /* The onboarding flow remains usable when browser storage is unavailable. */
        }
        const routine =
          selectedMode === "auto"
            ? (previewRoutine ?? makeRoutineProposal(variation))
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
          if (preferredLanguage) draft.settings.language = preferredLanguage;
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
      <h1 className="-translate-y-2 mb-5 text-center text-2xl font-bold">
        {step === "profile"
          ? t("Crear tu perfil", "Create your profile")
          : previewRoutine
            ? t("Revisá tu rutina", "Review your routine")
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
            if (!pending && mode === "auto" && !previewRoutine) {
              showRoutinePreview();
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
            {mode === "auto" && configuring && !previewRoutine && (
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
                      ["Baja grasa corporal", "Lose body fat"],
                      ["Ganar masa corporal", "Gain body mass"],
                      ["Fuerza e hipertrofia", "Strength and hypertrophy"],
                      [
                        "Mejorar resistencia cardiovascular",
                        "Improve cardiovascular endurance",
                      ],
                    ].map(([es, en]) => (
                      <option key={es} value={es}>
                        {t(es!, en!)}
                      </option>
                    ))}
                  </select>
                </label>
                {goal === "Mejorar resistencia cardiovascular" && (
                  <p className="onboarding-suggestion" role="status">
                    {t(
                      "La vista previa propone ejercicios de fuerza. Para correr o pedalear, podés usar el seguimiento de actividad de Fitty.",
                      "The preview suggests strength exercises. Use Fitty activity tracking for running or cycling.",
                    )}
                  </p>
                )}
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
          {mode === "auto" && configuring && previewRoutine && (
            <div className="onboarding-preview space-y-4">
              <div>
                <p className="eyebrow">
                  {t("Vista previa editable", "Editable preview")}
                </p>
                <h2 className="text-xl font-bold">
                  {t("Tu rutina sugerida", "Your suggested routine")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Podés quitar o agregar ejercicios, volver a cambiar tus datos o generar otra propuesta.",
                    "Remove or add exercises, go back to change your details, or generate another suggestion.",
                  )}
                </p>
              </div>
              {goal === "Mejorar resistencia cardiovascular" && (
                <p className="onboarding-suggestion" role="status">
                  {t(
                    "Esta rutina usa ejercicios de fuerza; no incluye sesiones de carrera o bicicleta.",
                    "This routine uses strength exercises; it does not include running or cycling sessions.",
                  )}
                </p>
              )}
              {previewRoutine.days.map((day) => {
                const dayGroups = [...new Set(
                  day.items
                    .map((id) => availableExercises.find((exercise) => exercise.id === id)?.group)
                    .filter((group): group is MuscleGroup => Boolean(group)),
                )];
                return (
                  <details
                    className="panel onboarding-preview-day"
                    key={day.id}
                  >
                    <summary className="onboarding-preview-day-summary">
                      <span className="onboarding-preview-day-title">
                        {editingDayId === day.id ? (
                          <input
                            autoFocus
                            aria-label={t("Nombre del día", "Day name")}
                            value={day.name}
                            disabled={busy || pending}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Enter") setEditingDayId(null);
                            }}
                            onBlur={() => setEditingDayId(null)}
                            onChange={(event) =>
                              setPreviewRoutine((current) =>
                                current
                                  ? {
                                      ...current,
                                      days: current.days.map((item) =>
                                        item.id === day.id
                                          ? { ...item, name: event.target.value }
                                          : item,
                                      ),
                                    }
                                  : current,
                              )
                            }
                          />
                        ) : (
                          <>
                            <span className="onboarding-preview-day-name-stack">
                              <span className="onboarding-preview-day-name">{day.name}</span>
                              <span className="onboarding-preview-day-groups">{dayGroups.join(" · ")}</span>
                            </span>
                          </>
                        )}
                      </span>
                      <span className="onboarding-preview-day-count">
                        {day.items.length} {t("ejercicios", "exercises")}
                      </span>
                      {editingDayId !== day.id && (
                        <button
                          type="button"
                          className="onboarding-preview-edit-name"
                          aria-label={t("Editar nombre del día", "Edit day name")}
                          disabled={busy || pending}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setEditingDayId(day.id);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </button>
                      )}
                    </summary>
                    <ul className="onboarding-preview-exercises">
                      {day.items.map((id, index) => (
                        <li key={id + "-" + index}>
                          {(() => {
                            const exercise = availableExercises.find(
                              (item) => item.id === id,
                            );
                            return exercise ? (
                              <div className="onboarding-preview-exercise-card">
                                <button
                                  type="button"
                                  className="onboarding-preview-image-button"
                                  aria-label={t("Ver imagen completa de", "View full image of") + " " + exercise.name}
                                  onClick={() => setPreviewImageExercise(exercise)}
                                >
                                  <ExerciseVisual exercise={exercise} />
                                </button>
                                <span>{short(exercise.name)}</span>
                              </div>
                            ) : <span>{id}</span>;
                          })()}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="onboarding-preview-remove"
                            disabled={busy || pending}
                            aria-label={
                              t("Quitar", "Remove") +
                              " " +
                              (availableExercises.find(
                                (exercise) => exercise.id === id,
                              )?.name ?? id)
                            }
                            onClick={() =>
                              setPreviewRoutine((current) =>
                                current
                                  ? {
                                      ...current,
                                      days: current.days.map((item) =>
                                        item.id === day.id
                                          ? {
                                              ...item,
                                              items: item.items.filter(
                                                (_, itemIndex) =>
                                                  itemIndex !== index,
                                              ),
                                            }
                                          : item,
                                      ),
                                    }
                                  : current,
                              )
                            }
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      variant="secondary"
                      className="onboarding-add-exercise-button"
                      disabled={busy || pending}
                      onClick={() => setPickingForDayId(day.id)}
                    >
                      ＋ {t("Agregar ejercicio", "Add exercise")}
                    </Button>
                    {!day.items.length && (
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Agregá al menos un ejercicio para este día.",
                          "Add at least one exercise for this day.",
                        )}
                      </p>
                    )}
                  </details>
                );
              })}
            </div>
          )}
          <div className={`onboarding-actions ${previewRoutine ? "has-preview" : ""}`}>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || pending}
              onClick={() => {
                if (previewRoutine) {
                  setPreviewRoutine(null);
                  window.scrollTo(0, 0);
                } else if (configuring) setConfiguring(false);
                else setStep("profile");
              }}
            >
              {previewRoutine
                ? t("Atrás", "Back")
                : t("Volver", "Back")}
            </Button>
            {previewRoutine && (
              <Button type="button" variant="secondary" disabled={busy || pending} onClick={showRoutinePreview}>
                {t("Regenerar", "Regenerate")}
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                busy ||
                (configuring && !groups.length) ||
                (previewRoutine?.days.some((day) => !day.items.length) ?? false)
              }
            >
              {busy
                ? t("Guardando…", "Saving…")
                : pending
                  ? t("Reintentar sincronización", "Retry sync")
                  : configuring && !previewRoutine
                    ? t("Ver vista previa", "Preview routine")
                    : previewRoutine
                      ? t("Continuar", "Continue")
                      : mode === "auto"
                        ? t("Configurar rutina", "Set up routine")
                        : t("Entrar a Fitty", "Go to Fitty")}
            </Button>
          </div>
        </form>
      )}
      <ExerciseDetails
        exercise={previewImageExercise}
        onClose={() => setPreviewImageExercise(null)}
      />
      {pickingForDayId && (
        <ExercisePicker
          onClose={() => setPickingForDayId(null)}
          onPick={(ids) => {
            const dayId = pickingForDayId;
            const targetDay = previewRoutine?.days.find((day) => day.id === dayId);
            const addedCount = ids.filter((id) => !targetDay?.items.includes(id)).length;
            setPreviewRoutine((current) =>
              current
                ? {
                    ...current,
                    days: current.days.map((day) =>
                      day.id === dayId
                        ? { ...day, items: [...day.items, ...ids.filter((id) => !day.items.includes(id))] }
                        : day,
                    ),
                  }
                : current,
            );
            setPickingForDayId(null);
            if (addedCount > 0 && targetDay)
              notify(t(`${addedCount} ejercicios agregados a ${targetDay.name}.`, `${addedCount} exercises added to ${targetDay.name}.`));
          }}
        />
      )}
    </>
  );
}
