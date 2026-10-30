"use client";
import type { ReactNode } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "@/state/app-provider";
export function SortableDays({
  rid,
  ids,
  children,
}: {
  rid: string;
  ids: string[];
  children: ReactNode;
}) {
  const { change } = useApp();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        change((draft) => {
          const routine = draft.routines.find((item) => item.id === rid);
          if (!routine) return;
          const from = routine.days.findIndex((day) => day.id === active.id),
            to = routine.days.findIndex((day) => day.id === over.id);
          if (from >= 0 && to >= 0)
            routine.days = arrayMove(routine.days, from, to);
        });
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
export function SortableDay({
  id,
  title,
  children,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const sort = useSortable({ id });
  return (
    <details
      ref={sort.setNodeRef}
      className="routine-day"
      data-routine-day={id}
      style={{
        transform: CSS.Transform.toString(sort.transform),
        transition: sort.transition,
        opacity: sort.isDragging ? 0.65 : 1,
        position: "relative",
        zIndex: sort.isDragging ? 1 : undefined,
      }}
    >
      <summary
        ref={sort.setActivatorNodeRef}
        className="font-bold sortable-day-title"
        {...sort.attributes}
        {...sort.listeners}
      >
        {title}
      </summary>
      {children}
    </details>
  );
}
