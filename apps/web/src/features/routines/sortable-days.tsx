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
  action,
  children,
}: {
  id: string;
  title: ReactNode;
  /** Control shown beside the title while the day is open. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const sort = useSortable({ id });
  // A button role would hide the controls inside the summary from screen readers.
  const { role: _role, ...attributes } = sort.attributes;
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
        {...attributes}
        {...sort.listeners}
      >
        {title}
        {action && (
          // Pressing the control must not start dragging the day.
          <span
            className="routine-day-action"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {action}
          </span>
        )}
      </summary>
      {children}
    </details>
  );
}
