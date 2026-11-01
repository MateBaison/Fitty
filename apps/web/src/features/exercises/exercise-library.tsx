"use client";

import { shortExerciseName as short } from "@fitty/core/data/exercise-name";
import { useMemo, useState } from "react";
import { useApp } from "@/state/app-provider";
import { catalogFor, type CatalogExercise } from "@fitty/core/domain/workouts";
import { muscleGroups, type MuscleGroup } from "@fitty/core/domain/schemas/exercise";
import { CustomExerciseForm } from "./custom-exercise-form";
import {
  equipmentFilters,
  matchesEquipment,
  muscleImages,
  fullBodyImage,
  normalizeSearch,
  type EquipmentFilter,
} from "@fitty/core/data/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { ExerciseVisual } from "./exercise-visual";
import { ExerciseDetails } from "./exercise-details";
export function ExerciseLibrary() {
  const { snapshot, change, notify, t } = useApp();
  const [group, setGroup] = useState<MuscleGroup | "Todos" | "Favoritos">(
      "Todos",
    ),
    [query, setQuery] = useState(""),
    [equipment, setEquipment] = useState<EquipmentFilter>("Todos"),
    [selected, setSelected] = useState<CatalogExercise | null>(null),
    [custom, setCustom] = useState(false),
    [addId, setAddId] = useState<string | null>(null);
  const [zoning, setZoning] = useState(false),
    [filtering, setFiltering] = useState(false);
  const zoneName = (value: MuscleGroup | "Todos" | "Favoritos") =>
    value === "Todos"
      ? t("Todo", "All")
      : value === "Favoritos"
        ? `★ ${t("Favoritos", "Favorites")}`
        : t(value, value);
  const zoneImage = (value: MuscleGroup | "Todos" | "Favoritos") =>
    value === "Favoritos"
      ? null
      : `/assets/${value === "Todos" ? fullBodyImage : muscleImages[value]}`;
  const filtered = useMemo(
    () =>
      catalogFor(snapshot).filter(
        (exercise) =>
          (group === "Todos" ||
            (group === "Favoritos"
              ? snapshot.favorites.includes(exercise.id)
              : exercise.group === group)) &&
          matchesEquipment(exercise, equipment) &&
          normalizeSearch(exercise.name + " " + exercise.equipment).includes(
            normalizeSearch(query),
          ),
      ),
    [snapshot, group, equipment, query],
  );
  const index = filtered.findIndex((exercise) => exercise.id === selected?.id);
  return (
    <>
      <div className="library-controls">
        <label
          htmlFor="exercise-search"
          className="mb-2 block text-sm text-muted-foreground"
        >
          {t("Buscar ejercicios", "Search exercises")}
        </label>
        <Input
          id="exercise-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("Buscar ejercicio", "Search exercise")}
        />
      </div>
      <section className="muscle-summary">
        <button
          type="button"
          className="muscle-summary-image"
          aria-label={t("Seleccionar zona", "Select area")}
          onClick={() => setZoning(true)}
        >
          {zoneImage(group) ? (
            <img src={zoneImage(group)!} alt={zoneName(group).replace("★ ", "")} />
          ) : (
            <span aria-hidden="true">★</span>
          )}
        </button>
        <div className="zone-controls">
          <span className="eyebrow">{t("Seleccionar zona", "Select area")} ▾</span>
          <button
            type="button"
            className="zone-pick"
            aria-label={`${t("Seleccionar zona", "Select area")}: ${zoneName(group)}`}
            onClick={() => setZoning(true)}
          >
            {zoneName(group).replace("★ ", "")}
          </button>
          <span className="eyebrow">{t("Filtrar", "Filter")} ▾</span>
          <button
            type="button"
            className="zone-pick"
            aria-expanded={filtering}
            aria-label={t("Filtrar por equipo", "Filter by equipment")}
            onClick={() => setFiltering((current) => !current)}
          >
            {equipment === "Todos" ? t("Todo", "All") : equipment}
          </button>
        </div>
      </section>
      {filtering && (
        <div
          className="equipment-menu"
          role="group"
          aria-label={t("Equipo", "Equipment")}
        >
          {equipmentFilters.map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={equipment === filter}
              onClick={() => {
                setEquipment(filter);
                setFiltering(false);
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      )}
      <AppDialog
        open={zoning}
        onClose={() => setZoning(false)}
        title={t("Seleccionar zona", "Select area")}
      >
        <div className="zone-list" role="group" aria-label={t("Zonas musculares", "Muscle groups")}>
          {(["Favoritos", "Todos", ...muscleGroups] as const).map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={group === name}
              onClick={() => {
                setGroup(name);
                setZoning(false);
              }}
            >
              {zoneImage(name) ? (
                <img src={zoneImage(name)!} alt="" />
              ) : (
                <span aria-hidden="true">★</span>
              )}
              <strong>{zoneName(name).replace("★ ", "")}</strong>
            </button>
          ))}
        </div>
      </AppDialog>
      <div className="exercise-results">
        <p role="status" className="text-sm text-muted-foreground">
          {filtered.length} {t("ejercicios", "exercises")}
        </p>
        <Button
          variant="secondary"
          className="library-create"
          onClick={() => setCustom(true)}
        >
          ＋ {t("Crear ejercicio", "Create exercise")}
        </Button>
      </div>
      <div className="exercise-grid">
        {filtered.map((exercise) => (
          <button
            type="button"
            key={exercise.id}
            className="exercise-card"
            onClick={() => setSelected(exercise)}
            aria-label={`Ver ${exercise.name}`}
          >
            <ExerciseVisual exercise={exercise} />
            <h2>{short(exercise.name)}</h2>
            <p>
              {exercise.group} · {exercise.equipment}
            </p>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="py-10 text-center text-muted-foreground">
          {t(
            "No encontramos ejercicios con estos filtros.",
            "No exercises match these filters.",
          )}
        </p>
      )}
      <ExerciseDetails
        exercise={selected}
        onClose={() => setSelected(null)}
        previous={filtered[index - 1]}
        next={filtered[index + 1]}
        onSelect={setSelected}
        onAdd={() => {
          setAddId(selected?.id ?? null);
          setSelected(null);
        }}
      />
      <AppDialog
        open={addId !== null}
        onClose={() => setAddId(null)}
        title={t("Elegir día", "Choose day")}
      >
        <div className="space-y-2">
          {snapshot.routines.flatMap((routine) =>
            routine.days.map((day) => (
              <Button
                key={day.id}
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (
                    addId &&
                    change((draft) => {
                      draft.routines
                        .find((item) => item.id === routine.id)
                        ?.days.find((item) => item.id === day.id)
                        ?.items.push(addId);
                    })
                  ) {
                    setAddId(null);
                    notify(t("Ejercicio agregado", "Exercise added"));
                  }
                }}
              >
                {routine.name} · {day.name}
              </Button>
            )),
          )}
          {!snapshot.routines.some((routine) => routine.days.length) && (
            <p>
              {t(
                "Primero creá una rutina con al menos un día en Inicio.",
                "First create a routine with at least one day on Home.",
              )}
            </p>
          )}
        </div>
      </AppDialog>
      <AppDialog
        open={custom}
        onClose={() => setCustom(false)}
        title={t("Crear ejercicio", "Create exercise")}
      >
        <CustomExerciseForm
          onCreated={(exercise) => {
            setCustom(false);
            setGroup(exercise.group);
          }}
        />
      </AppDialog>
    </>
  );
}
