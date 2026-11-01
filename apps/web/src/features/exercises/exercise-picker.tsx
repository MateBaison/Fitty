"use client";

import { shortExerciseName as short } from "@fitty/core/data/exercise-name";
import { useState } from "react";
import { Star } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { catalogFor } from "@fitty/core/domain/workouts";
import { muscleGroups, type MuscleGroup } from "@fitty/core/domain/schemas/exercise";
import { normalizeSearch, muscleImages } from "@fitty/core/data/exercises";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomExerciseForm } from "./custom-exercise-form";
import { ExerciseVisual } from "./exercise-visual";
export function ExercisePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (ids: string[]) => void;
}) {
  const { snapshot, change, t } = useApp();
  const [creating, setCreating] = useState(false);
  const [group, setGroup] = useState<MuscleGroup | "Favoritos" | null>(null),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  const list = catalogFor(snapshot).filter(
    (exercise) =>
      (group === "Favoritos"
        ? snapshot.favorites.includes(exercise.id)
        : exercise.group === group) &&
      normalizeSearch(exercise.name + exercise.equipment).includes(
        normalizeSearch(query),
      ),
  );
  if (creating)
    return (
      <AppDialog
        open
        onClose={() => setCreating(false)}
        title={t("Crear ejercicio", "Create exercise")}
      >
        <CustomExerciseForm
          onCreated={(exercise) => {
            setSelected((previous) => [...previous, exercise.id]);
            setGroup(exercise.group);
            setQuery("");
            setCreating(false);
          }}
        />
        <Button variant="secondary" onClick={() => setCreating(false)}>
          {t("Cancelar", "Cancel")}
        </Button>
      </AppDialog>
    );
  return (
    <AppDialog
      open
      onClose={onClose}
      title={t("Agregar ejercicios", "Add exercises")}
      description={t(
        "Elegí uno o varios ejercicios; podés ver sus imágenes antes de agregarlos.",
        "Choose one or more exercises and review their images before adding them.",
      )}
    >
      <Button variant="secondary" onClick={() => setCreating(true)}>
        ＋ {t("Crear ejercicio", "Create exercise")}
      </Button>
      {!group ? (
        <div className="exercise-grid">
          {(["Favoritos", ...muscleGroups] as const).map((muscle) => (
            <button
              type="button"
              className="exercise-card"
              aria-label={muscle}
              key={muscle}
              onClick={() => setGroup(muscle)}
            >
              {muscle === "Favoritos" ? (
                <Star className="mx-auto my-6 size-16 text-yellow-300" />
              ) : (
                <img
                  className="picker-muscle-image"
                  src={`/assets/${muscleImages[muscle]}`}
                  alt={muscle}
                />
              )}
              <h2>{muscle}</h2>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setGroup(null);
              setQuery("");
            }}
          >
            ← {t("Zonas musculares", "Muscle groups")}
          </Button>
          <Input
            aria-label={t("Buscar ejercicio", "Search exercise")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Buscar…", "Search…")}
          />
          <div className="space-y-2">
            {list.length ? list.map((exercise) => (
              <div className="picker-row" key={exercise.id}>
                <div className="picker-thumb">
                  <ExerciseVisual exercise={exercise} />
                </div>
                <div className="min-w-0 flex-1">
                  <strong>{short(exercise.name)}</strong>
                  <small className="block text-muted-foreground">
                    {exercise.equipment}
                  </small>
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Favorito ${exercise.name}`}
                  onClick={() =>
                    change((draft) => {
                      draft.favorites = draft.favorites.includes(exercise.id)
                        ? draft.favorites.filter((id) => id !== exercise.id)
                        : [...draft.favorites, exercise.id];
                    })
                  }
                >
                  <Star
                    className={
                      snapshot.favorites.includes(exercise.id)
                        ? "favorite-star active"
                        : "favorite-star"
                    }
                  />
                </Button>
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${exercise.name}`}
                  checked={selected.includes(exercise.id)}
                  className="exercise-picker-checkbox"
                  onChange={() =>
                    setSelected((previous) =>
                      previous.includes(exercise.id)
                        ? previous.filter((id) => id !== exercise.id)
                        : [...previous, exercise.id],
                    )
                  }
                />
              </div>
            )) : (
              <p className="exercise-picker-empty" role="status">
                {t("No encontramos ejercicios con esa búsqueda.", "No exercises match that search.")}
              </p>
            )}
          </div>
        </>
      )}
      <div className="exercise-picker-confirm">
        <span aria-live="polite">
          {selected.length
            ? `${selected.length} ${t("seleccionados", "selected")}`
            : t("Elegí ejercicios para continuar", "Select exercises to continue")}
        </span>
        <Button disabled={!selected.length} onClick={() => onPick(selected)}>
          {t("Agregar seleccionados", "Add selected")} ({selected.length})
        </Button>
      </div>
    </AppDialog>
  );
}
