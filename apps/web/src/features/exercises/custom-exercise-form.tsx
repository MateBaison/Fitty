"use client";
import { useRef, useState } from "react";
import {
  Camera,
  Dumbbell,
  PersonStanding,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { photosFit } from "@fitty/core/domain/exercise-photos";
import {
  customExerciseFormSchema,
  MAX_EXERCISE_PHOTOS,
} from "@fitty/core/domain/schemas/snapshot";
import {
  muscleGroups,
  type MuscleGroup,
} from "@fitty/core/domain/schemas/exercise";
import { equipmentFilters } from "@fitty/core/data/exercises";
import { compressedPhoto } from "@/lib/browser/photos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** A square choice whose native menu opens when the tile is pressed. */
function SelectTile({
  icon: Icon,
  name,
  label,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  name: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="exercise-tile">
      <Icon aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <strong aria-hidden="true">
        {options.find((option) => option.value === value)?.label}
      </strong>
      <select
        name={name}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const equipment = equipmentFilters.filter((item) => item !== "Todos");

export function CustomExerciseForm({
  onCreated,
}: {
  onCreated: (exercise: { id: string; group: MuscleGroup }) => void;
}) {
  const { snapshot, change, notify, t } = useApp();
  const photoInput = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<string>(muscleGroups[0]);
  const [gear, setGear] = useState<string>(equipment[0]!);
  const [tracking, setTracking] = useState("reps");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState(1);
  // Shown inside the form: the page notice stays behind the dialog.
  const [error, setError] = useState("");
  const full = () =>
    t(
      "No queda espacio para más fotos. Quitá alguna foto guardada para poder agregar otra.",
      "No room for more photos. Remove a saved photo to add another one.",
    );
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
            ...(photos.length ? { photos } : {}),
          });
        if (!parsed.success)
          return setError(
            t(
              "Revisá el nombre y las instrucciones (máximo 10 líneas).",
              "Check the name and instructions (up to 10 lines).",
            ),
          );
        if (photos.length && !photosFit(snapshot, photos))
          return setError(full());
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
      <div className="exercise-tiles">
        <SelectTile
          icon={PersonStanding}
          name="group"
          label={t("Grupo muscular", "Muscle group")}
          value={group}
          onChange={setGroup}
          options={muscleGroups.map((muscle) => ({
            value: muscle,
            label: t(muscle, muscle),
          }))}
        />
        <SelectTile
          icon={Dumbbell}
          name="equipment"
          label={t("Equipamiento", "Equipment")}
          value={gear}
          onChange={setGear}
          options={equipment.map((item) => ({
            value: item,
            label: t(item, item),
          }))}
        />
        <SelectTile
          icon={Timer}
          name="tracking"
          label={t("Registrar por", "Track by")}
          value={tracking}
          onChange={setTracking}
          options={[
            { value: "reps", label: t("Repeticiones", "Repetitions") },
            { value: "seconds", label: t("Tiempo", "Time") },
          ]}
        />
        <button
          type="button"
          className="exercise-tile"
          disabled={busy || photos.length >= MAX_EXERCISE_PHOTOS}
          onClick={() => photoInput.current?.click()}
        >
          <Camera aria-hidden="true" />
          <span>{t("Fotos", "Photos")}</span>
          <strong>
            {photos.length
              ? `${photos.length} / ${MAX_EXERCISE_PHOTOS}`
              : t("Agregar foto", "Add photo")}
          </strong>
        </button>
      </div>
      {photos.length > 0 && (
        <div className="exercise-photo-list">
          {photos.map((photo, index) => (
            <div key={index} className="exercise-photo-item">
              <img src={photo} alt={`${t("Foto", "Photo")} ${index + 1}`} />
              <button
                type="button"
                aria-label={`${t("Quitar foto", "Remove photo")} ${index + 1}`}
                onClick={() => {
                  setError("");
                  setPhotos((current) =>
                    current.filter((_, position) => position !== index),
                  );
                }}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={photoInput}
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-label={t("Fotos del ejercicio", "Exercise photos")}
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []).slice(
            0,
            MAX_EXERCISE_PHOTOS - photos.length,
          );
          event.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setError("");
          try {
            // Reference photos are smaller than other photos: they stay in the account.
            const added = await Promise.all(
              files.map((file) => compressedPhoto(file, 800, 0.65)),
            );
            const next = [...photos, ...added];
            if (!photosFit(snapshot, next)) setError(full());
            else setPhotos(next);
          } catch {
            setError(
              t(
                "No se pudo cargar la foto. Elegí una imagen menor a 8 MB.",
                "The photo could not be loaded. Choose an image under 8 MB.",
              ),
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      <label className="block">
        {t("Instrucciones (opcional)", "Instructions (optional)")}
        <textarea
          name="steps"
          className="exercise-steps"
          rows={lines}
          maxLength={3000}
          placeholder={t(
            "Una indicación por línea",
            "One instruction per line",
          )}
          onChange={(event) =>
            setLines(Math.min(10, event.target.value.split("\n").length))
          }
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {t("Guardar ejercicio", "Save exercise")}
      </Button>
    </form>
  );
}
