"use client";
import { useState } from "react";
import { exerciseImage } from "@fitty/core/data/exercises";
import { useApp } from "@/state/app-provider";
import type { CatalogExercise } from "@fitty/core/domain/workouts";
export function ExerciseVisual({
  exercise,
  large = false,
}: {
  exercise: CatalogExercise;
  large?: boolean;
}) {
  const { snapshot, t } = useApp();
  const [chosen, setChosen] = useState({ id: exercise.id, index: 0 });
  const photos = exercise.photos ?? [];
  if (photos.length) {
    const index = large && chosen.id === exercise.id ? chosen.index : 0;
    const image = (
      <img
        src={photos[index] ?? photos[0]}
        alt={`${t("Foto de", "Photo of")} ${exercise.name}`}
        className={`exercise-image ${large ? "large-exercise-image" : ""}`}
        loading="lazy"
      />
    );
    if (!large || photos.length < 2) return image;
    return (
      <div className="space-y-2">
        {image}
        <div className="exercise-photo-list justify-center">
          {photos.map((photo, position) => (
            <button
              key={position}
              type="button"
              className="exercise-photo-thumb"
              aria-label={`${t("Foto", "Photo")} ${position + 1}`}
              aria-pressed={position === index}
              onClick={() => setChosen({ id: exercise.id, index: position })}
            >
              <img src={photo} alt="" />
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (exercise.custom)
    return (
      <div
        className="custom-visual"
        aria-label={t("Ejercicio personalizado", "Custom exercise")}
      >
        ＋
        <small>
          {t("Personalizado ·", "Custom ·")}{" "}
          {exercise.tracking === "seconds"
            ? t("Segundos", "Seconds")
            : t("Repeticiones", "Repetitions")}
        </small>
      </div>
    );
  return (
    <img
      src={exerciseImage(exercise, snapshot.profile.gender)}
      alt={`Inicio y final de ${exercise.name}`}
      className={`exercise-image ${large ? "large-exercise-image" : ""}`}
      loading="lazy"
    />
  );
}
