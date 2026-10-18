"use client";
import { useState } from "react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { bodyMeasurementInputSchema } from "@/domain/schemas/snapshot";
import { compressedPhoto, safePhoto } from "@/lib/browser/photos";
import { localDateKey } from "@/domain/workouts";
import { ProgressChart } from "./progress-chart";
import type { ProgressPeriod } from "@/domain/progress-period";
const fields = [
  ["weightKg", "Peso", "Weight"],
  ["waistCm", "Cintura", "Waist"],
  ["hipsCm", "Cadera", "Hips"],
  ["chestCm", "Pecho", "Chest"],
  ["armCm", "Brazo", "Arm"],
  ["thighCm", "Muslo", "Thigh"],
] as const;
export function BodyProgress({
  range,
}: {
  range: { start: Date; end: Date };
  period: ProgressPeriod;
}) {
  const { snapshot, change, t, notify } = useApp();
  const [open, setOpen] = useState(false),
    [photo, setPhoto] = useState<string | undefined>(),
    [busy, setBusy] = useState(false),
    [metric, setMetric] = useState<(typeof fields)[number][0]>("weightKg"),
    [left, setLeft] = useState(""),
    [right, setRight] = useState("");
  const unit = snapshot.settings.weight ?? "kg",
    factor = unit === "lb" ? 2.20462 : 1,
    locale = snapshot.settings.language ?? "es";
  const measurements = [...(snapshot.bodyMeasurements ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const filtered = measurements.filter(
    (m) =>
      new Date(`${m.date}T12:00:00`) >= range.start &&
      new Date(`${m.date}T12:00:00`) < range.end,
  );
  const weights = snapshot.sessions.flatMap((s) =>
    s.bodyWeightStartKg != null
      ? [{ date: new Date(s.date), value: s.bodyWeightStartKg * factor }]
      : [],
  );
  const points = filtered.flatMap((m) =>
    m[metric] != null
      ? [
          {
            date: new Date(`${m.date}T12:00:00`),
            value: m[metric]! * (metric === "weightKg" ? factor : 1),
          },
        ]
      : [],
  );
  const chart = points.length
    ? points
    : metric === "weightKg"
      ? weights
          .filter((p) => p.date >= range.start && p.date < range.end)
          .sort((a, b) => +a.date - +b.date)
      : [];
  const photos = [
    ...measurements.flatMap((m) =>
      safePhoto(m.photo)
        ? [{ id: m.id, date: m.date, src: safePhoto(m.photo)! }]
        : [],
    ),
    ...snapshot.sessions.flatMap((s) =>
      (s.photos ?? []).flatMap((p, i) =>
        safePhoto(p)
          ? [
              {
                id: `${s.id}-${i}`,
                date: localDateKey(s.date),
                src: safePhoto(p)!,
              },
            ]
          : [],
      ),
    ),
  ]
    .filter((p) => {
      const date = new Date(`${p.date}T12:00:00`);
      return date >= range.start && date < range.end;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const selectedPhotos = [
    photos.find((p) => p.id === left) ?? photos[0],
    photos.find((p) => p.id === right) ?? photos.at(-1),
  ];
  return (
    <>
      <section className="panel">
        <div className="progress-section-heading">
          <div>
            <h2>{t("Medidas corporales", "Body measurements")}</h2>
            <p>
              {t(
                "Registrá solo lo que quieras seguir.",
                "Log only what you want to track.",
              )}
            </p>
          </div>
          <Button
            onClick={() => {
              setPhoto(undefined);
              setOpen(true);
            }}
          >
            {t("Agregar registro", "Add entry")}
          </Button>
        </div>
        <label>
          {t("Medida", "Measurement")}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            {fields.map(([id, es, en]) => (
              <option value={id} key={id}>
                {t(es, en)} ({id === "weightKg" ? unit : "cm"})
              </option>
            ))}
          </select>
        </label>
        <ProgressChart
          points={chart}
          label={t("Evolución corporal", "Body progression")}
          unit={metric === "weightKg" ? unit : "cm"}
        />
        <details>
          <summary>{t("Historial de medidas", "Measurement history")}</summary>
          {[...filtered].reverse().map((m) => (
            <article className="progress-history-row" key={m.id}>
              <strong>
                {new Date(`${m.date}T12:00:00`).toLocaleDateString(locale)}
              </strong>
              <p>
                {fields
                  .flatMap(([id, es, en]) =>
                    m[id] != null
                      ? [
                          `${t(es, en)}: ${(m[id]! * (id === "weightKg" ? factor : 1)).toLocaleString(locale, { maximumFractionDigits: 1 })} ${id === "weightKg" ? unit : "cm"}`,
                        ]
                      : [],
                  )
                  .join(" · ")}
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  if (
                    confirm(
                      t(
                        "¿Eliminar este registro corporal?",
                        "Delete this body entry?",
                      ),
                    )
                  )
                    change((d) => {
                      d.bodyMeasurements = d.bodyMeasurements?.filter(
                        (x) => x.id !== m.id,
                      );
                    });
                }}
              >
                {t("Eliminar", "Delete")}
              </Button>
            </article>
          ))}
        </details>
      </section>
      <section className="panel">
        <h2>{t("Comparar fotos", "Compare photos")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Tus fotos y medidas son privadas.",
            "Your photos and measurements are private.",
          )}
        </p>
        {photos.length > 1 ? (
          <div className="progress-photo-comparison">
            {selectedPhotos.map((p, i) => (
              <div key={i}>
                <label>
                  {i === 0 ? t("Antes", "Before") : t("Después", "After")}
                  <select
                    value={p?.id ?? ""}
                    onChange={(e) =>
                      (i === 0 ? setLeft : setRight)(e.target.value)
                    }
                  >
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {new Date(`${p.date}T12:00:00`).toLocaleDateString(
                          locale,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
                {p && (
                  <img
                    src={p.src}
                    alt={
                      i === 0
                        ? t("Foto anterior", "Earlier photo")
                        : t("Foto posterior", "Later photo")
                    }
                    width={600}
                    height={800}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="progress-empty">
            {t(
              "Agregá dos fotos en tus registros para empezar a comparar.",
              "Add two photos to your entries to start comparing.",
            )}
          </p>
        )}
      </section>
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("Agregar registro corporal", "Add body entry")}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const values: Record<string, unknown> = {
              id: crypto.randomUUID(),
              date: form.get("date"),
              ...(photo ? { photo } : {}),
            };
            for (const [key] of fields) {
              const raw = String(form.get(key) ?? "").trim();
              if (raw)
                values[key] = Number(raw) / (key === "weightKg" ? factor : 1);
            }
            const parsed = bodyMeasurementInputSchema.safeParse(values);
            if (!parsed.success)
              return notify(
                t(
                  "Revisá la fecha y agregá una medida válida o una foto.",
                  "Check the date and add a valid measurement or photo.",
                ),
              );
            if (
              change((d) => {
                (d.bodyMeasurements ??= []).push(parsed.data);
              })
            ) {
              setOpen(false);
              notify(t("Registro corporal guardado", "Body entry saved"));
            }
          }}
        >
          <label>
            {t("Fecha", "Date")}
            <Input
              type="date"
              name="date"
              defaultValue={localDateKey(new Date())}
              max={localDateKey(new Date())}
              required
            />
          </label>
          <div className="form-grid">
            {fields.map(([id, es, en]) => (
              <label key={id}>
                {t(es, en)} ({id === "weightKg" ? unit : "cm"})
                <Input
                  name={id}
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  max={id === "weightKg" ? 700 * factor : 400}
                />
              </label>
            ))}
          </div>
          <label>
            {t("Foto opcional", "Optional photo")}
            <Input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  setPhoto(await compressedPhoto(file));
                } catch (error) {
                  notify(
                    error instanceof Error
                      ? error.message
                      : t(
                          "No se pudo preparar la imagen.",
                          "Could not prepare image.",
                        ),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {photo && (
            <img
              className="max-h-48 rounded-xl object-contain"
              src={photo}
              alt={t("Vista previa", "Preview")}
              width={240}
              height={240}
            />
          )}
          <Button type="submit" disabled={busy}>
            {busy
              ? t("Preparando imagen…", "Preparing image…")
              : t("Guardar registro", "Save entry")}
          </Button>
        </form>
      </AppDialog>
    </>
  );
}
