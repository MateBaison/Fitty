"use client";
import { useApp } from "@/state/app-provider";
import { customExerciseFormSchema } from "@fitty/core/domain/schemas/snapshot";
import { muscleGroups, type MuscleGroup } from "@fitty/core/domain/schemas/exercise";
import { equipmentFilters } from "@fitty/core/data/exercises";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CustomExerciseForm({
  onCreated,
}: {
  onCreated: (exercise: { id: string; group: MuscleGroup }) => void;
}) {
  const { change, notify, t } = useApp();
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget),
          parsed = customExerciseFormSchema.safeParse({
            id: "custom-" + crypto.randomUUID(),
            name: String(form.get("name") ?? ""),
            group: form.get("group"),
            equipment: form.get("equipment"),
            tracking: form.get("tracking"),
            steps: String(form.get("steps") ?? "")
              .split("\n")
              .filter((line) => line.trim()),
          });
        if (!parsed.success)
          return notify(
            "Revisá el nombre y las instrucciones (máximo 10 líneas).",
          );
        if (
          change((draft) => {
            draft.customExercises.push({ ...parsed.data, custom: true });
          })
        ) {
          onCreated({ id: parsed.data.id, group: parsed.data.group });
          notify(
            t("Ejercicio personalizado guardado", "Custom exercise saved"),
          );
        }
      }}
    >
      <label className="block">
        {t("Nombre", "Name")}
        <Input name="name" required maxLength={100} />
      </label>
      <label className="block">
        {t("Grupo muscular", "Muscle group")}
        <select name="group" aria-label={t("Grupo muscular", "Muscle group")}>
          {muscleGroups.map((muscle) => (
            <option key={muscle}>{muscle}</option>
          ))}
        </select>
      </label>
      <label className="block">
        {t("Equipamiento", "Equipment")}
        <select name="equipment" aria-label={t("Equipamiento", "Equipment")}>
          {equipmentFilters
            .filter((item) => item !== "Todos")
            .map((item) => (
              <option key={item}>{item}</option>
            ))}
        </select>
      </label>
      <label className="block">
        {t("Cómo registrar las series", "How to track sets")}
        <select
          name="tracking"
          aria-label={t("Cómo registrar las series", "How to track sets")}
        >
          <option value="reps">{t("Repeticiones", "Repetitions")}</option>
          <option value="seconds">
            {t("Tiempo (segundos)", "Time (seconds)")}
          </option>
        </select>
      </label>
      <label className="block">
        {t("Instrucciones (opcional)", "Instructions (optional)")}
        <textarea
          name="steps"
          maxLength={3000}
          placeholder={t(
            "Una indicación por línea",
            "One instruction per line",
          )}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        {t(
          "No se genera una imagen técnica automáticamente.",
          "A technique image is not generated automatically.",
        )}
      </p>
      <Button type="submit">{t("Guardar ejercicio", "Save exercise")}</Button>
    </form>
  );
}
