"use client";

import { useExerciseName } from "@/state/exercise-name";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { findExercise } from "@fitty/core/domain/workouts";
import { removeRoutineExercise } from "@fitty/core/domain/routine-day";
import { ExerciseDetails } from "@/features/exercises/exercise-details";
import { ExerciseVisual } from "@/features/exercises/exercise-visual";
import { ExerciseOptions } from "./exercise-options";
function SortableItem({
  id,
  exerciseId,
  canSuperset,
  replace,
  superset,
  remove,
}: {
  id: string;
  exerciseId: string;
  canSuperset: boolean;
  replace: () => void;
  superset: () => void;
  remove: () => void;
}) {
  const short = useExerciseName();
  const { snapshot } = useApp(),
    exercise = findExercise(snapshot, exerciseId),
    sort = useSortable({ id }),
    [enlarged, setEnlarged] = useState(false);
  return (
    <div
      ref={sort.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sort.transform),
        transition: sort.transition,
        opacity: sort.isDragging ? 0.6 : 1,
      }}
      className="picker-row"
      data-routine-exercise={exerciseId}
    >
      <button
        type="button"
        ref={sort.setActivatorNodeRef}
        className="drag-handle"
        aria-label={`Mover ${exercise?.name ?? exerciseId}`}
        {...sort.attributes}
        {...sort.listeners}
      >
        <GripVertical />
      </button>
      {exercise && (
        <button
          type="button"
          className="picker-thumb"
          aria-label={`Ampliar ${exercise.name}`}
          onClick={() => setEnlarged(true)}
        >
          <ExerciseVisual exercise={exercise} />
        </button>
      )}
      <span className="min-w-0 flex-1">{short(exercise?.name ?? exerciseId)}</span>
      <ExerciseOptions
        name={short(exercise?.name ?? exerciseId)}
        canSuperset={canSuperset}
        onReplace={replace}
        onSuperset={superset}
        onRemove={remove}
      />
      <ExerciseDetails
        exercise={enlarged ? (exercise ?? null) : null}
        onClose={() => setEnlarged(false)}
      />
    </div>
  );
}
export function SortableExercises({
  rid,
  did,
  onReplace,
  onSuperset,
}: {
  rid: string;
  did: string;
  onReplace: (index: number) => void;
  onSuperset: (exerciseId: string) => void;
}) {
  const { snapshot, change } = useApp(),
    day = snapshot.routines
      .find((routine) => routine.id === rid)
      ?.days.find((day) => day.id === did);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  if (!day) return null;
  const occurrences = new Map<string, number>();
  const ids = day.items.map((id) => {
    const occurrence = occurrences.get(id) ?? 0;
    occurrences.set(id, occurrence + 1);
    return `${rid}|${did}|${id}|${occurrence}`;
  });
  return (
    <DndContext
      sensors={sensors}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const from = ids.indexOf(String(active.id)),
          to = ids.indexOf(String(over.id));
        if (from < 0 || to < 0) return;
        change((draft) => {
          const target = draft.routines
            .find((routine) => routine.id === rid)
            ?.days.find((day) => day.id === did);
          if (target) target.items = arrayMove(target.items, from, to);
        });
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {day.items.map((id, index) => (
          <SortableItem
            key={ids[index]}
            id={ids[index] ?? ""}
            exerciseId={id}
            canSuperset={new Set(day.items).size > 1}
            replace={() => onReplace(index)}
            superset={() => onSuperset(id)}
            remove={() =>
              change((draft) => {
                const target = draft.routines
                  .find((routine) => routine.id === rid)
                  ?.days.find((day) => day.id === did);
                if (target) removeRoutineExercise(target, index);
              })
            }
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
