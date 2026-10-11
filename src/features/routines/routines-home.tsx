"use client";
import { menstrualCalendarEnabled } from "@/domain/menstrual-calendar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Switch } from "@base-ui/react/switch";
import {
  Pencil,
  Share,
  Trash2,
  Star,
  LibraryBig,
  ChartNoAxesCombined,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { ExercisePicker } from "@/features/exercises/exercise-picker";
import { SortableDays, SortableDay } from "./sortable-days";
import { SortableExercises } from "./sortable-exercises";
import { startWorkout, findExercise } from "@/domain/workouts";
import { buildAutomaticRoutine } from "@/domain/calculations/automatic-routine";
import { muscleImages } from "@/data/exercises";
import { ChevronDown } from "lucide-react";
import { muscleGroups, type MuscleGroup } from "@/domain/schemas/exercise";
import { decodeRoutine, encodeRoutine, importRoutine } from "@/domain/sharing";
import { INCOMING_ROUTINE_KEY } from "@/lib/storage/account-cache";
import { CalendarPanel } from "@/features/calendar/calendar-panel";
import { ReadinessDialog } from "@/features/workouts/readiness-dialog";

type Editor = {
  type: "new" | "rename" | "day" | "rename-day";
  rid?: string;
  did?: string;
} | null;

export function RoutinesHome() {
  const { snapshot, change, notify, t } = useApp(),
    router = useRouter();
  const [editor, setEditor] = useState<Editor>(null),
    [mode, setMode] = useState("choose"),
    [name, setName] = useState(""),
    [goal, setGoal] = useState("Fuerza e hipertrofia"),
    [groups, setGroups] = useState<MuscleGroup[]>([]),
    [days, setDays] = useState(3);
  const [picker, setPicker] = useState<{ rid: string; did: string } | null>(
      null,
    ),
    [quick, setQuick] = useState(false),
    [superset, setSuperset] = useState<{ rid: string; did: string } | null>(
      null,
    ),
    [members, setMembers] = useState<string[]>([]),
    [share, setShare] = useState(""),
    [incoming, setIncoming] = useState("");
  const selected =
      snapshot.routines.find((routine) => routine.id === snapshot.selected) ??
      snapshot.routines[0],
    workout = snapshot.workout;
  const [removingDay, setRemovingDay] = useState<{
    rid: string;
    did?: string;
  } | null>(null);
  const [deletingRoutine, setDeletingRoutine] = useState<string | null>(null);
  const [pendingStart, setPendingStart] = useState<{
    rid: string;
    did: string;
  } | null>(null);
  useEffect(() => {
    const token = sessionStorage.getItem(INCOMING_ROUTINE_KEY);
    if (!token) return;
    try {
      decodeRoutine(token);
      setIncoming(token);
    } catch {
      sessionStorage.removeItem(INCOMING_ROUTINE_KEY);
      notify("El enlace de rutina no es válido.");
    }
  }, [notify]);
  const start = (rid: string, did: string) => {
    if (change((draft) => startWorkout(draft, rid, did))) {
      setQuick(false);
      router.push("/workout");
    }
  };
  const begin = (rid: string, did: string) => {
    if (menstrualCalendarEnabled(snapshot.profile)) {
      setQuick(false);
      setPendingStart({ rid, did });
    } else start(rid, did);
  };
  const openEditor = (value: Editor, initial = "") => {
    setEditor(value);
    setName(initial);
    setGoal("Fuerza e hipertrofia");
    setMode("choose");
    setGroups([]);
  };
  const activeRoutine = snapshot.routines.find(
      (routine) => routine.id === workout?.rid,
    ),
    activeDay = activeRoutine?.days.find((day) => day.id === workout?.did);
  return (
    <>
      <AppDialog
        open={removingDay !== null}
        onClose={() => setRemovingDay(null)}
        title={t("Quitar día", "Remove day")}
      >
        {removingDay?.did ? (
          <div className="routine-delete-confirmation">
            <strong>
              {
                snapshot.routines
                  .find((routine) => routine.id === removingDay.rid)
                  ?.days.find((day) => day.id === removingDay.did)?.name
              }
            </strong>
            <p>{t("¿Quitar este día?", "Remove this day?")}</p>
            <p className="routine-delete-disclaimer">
              {t(
                "El historial se conserva. El entrenamiento en curso de este día, si lo hay, se cancelará.",
                "History is preserved. Any workout in progress for this day will be cancelled.",
              )}
            </p>
            <div className="routine-delete-confirmation-actions">
              <Button variant="secondary" onClick={() => setRemovingDay(null)}>
                {t("Cancelar", "Cancel")}
              </Button>
              <Button
                variant="destructive-solid"
                onClick={() => {
                  if (
                    change((draft) => {
                      const routine = draft.routines.find(
                        (item) => item.id === removingDay.rid,
                      );
                      if (routine)
                        routine.days = routine.days.filter(
                          (day) => day.id !== removingDay.did,
                        );
                      if (
                        draft.workout?.rid === removingDay.rid &&
                        draft.workout.did === removingDay.did
                      )
                        draft.workout = null;
                    })
                  )
                    setRemovingDay(null);
                }}
              >
                {t("Quitar día", "Remove day")}
              </Button>
            </div>
          </div>
        ) : (
          snapshot.routines
            .find((routine) => routine.id === removingDay?.rid)
            ?.days.map((day) => (
              <Button
                key={day.id}
                variant="secondary"
                onClick={() =>
                  setRemovingDay((previous) =>
                    previous ? { ...previous, did: day.id } : null,
                  )
                }
              >
                {day.name}
              </Button>
            ))
        )}
      </AppDialog>
      <AppDialog
        open={deletingRoutine !== null}
        onClose={() => setDeletingRoutine(null)}
        title={t("Eliminar rutina", "Delete routine")}
        titleAction={
          <span className="routine-delete-confirmation-icon" aria-hidden="true">
            <Trash2 />
          </span>
        }
      >
        <div className="routine-delete-confirmation">
          <strong>
            {
              snapshot.routines.find(
                (routine) => routine.id === deletingRoutine,
              )?.name
            }
          </strong>
          <p>
            {t(
              "¿Seguro que querés eliminar esta rutina con",
              "Are you sure you want to delete this routine with",
            )}{" "}
            <b>
              {snapshot.routines.find(
                (routine) => routine.id === deletingRoutine,
              )?.days.length ?? 0}{" "}
              {t("días", "days")}
            </b>
            ?
          </p>
          <p className="routine-delete-disclaimer">
            {t(
              "El historial se conserva. Si hay un entrenamiento en curso de esta rutina, se perderá.",
              "History is preserved. Any workout currently in progress for this routine will be lost.",
            )}
          </p>
          <div className="routine-delete-confirmation-actions">
            <Button
              variant="secondary"
              onClick={() => setDeletingRoutine(null)}
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              variant="destructive-solid"
              onClick={() => {
                if (
                  change((draft) => {
                    draft.routines = draft.routines.filter(
                      (routine) => routine.id !== deletingRoutine,
                    );
                    if (draft.workout?.rid === deletingRoutine)
                      draft.workout = null;
                    if (draft.selected === deletingRoutine)
                      draft.selected = draft.routines[0]?.id ?? null;
                  })
                )
                  setDeletingRoutine(null);
              }}
            >
              <Trash2 data-icon="inline-start" />
              {t("Eliminar rutina", "Delete routine")}
            </Button>
          </div>
        </div>
      </AppDialog>
      {pendingStart && (
        <ReadinessDialog
          open
          onClose={() => setPendingStart(null)}
          onStart={() => {
            start(pendingStart.rid, pendingStart.did);
            setPendingStart(null);
          }}
        />
      )}
      {workout ? (
        <section className="active-workout hero-panel mb-5">
          <div className="active-workout-details">
            <span className="eyebrow">
              ● {t("Entrenamiento en curso", "Workout in progress")}
            </span>
            <h2 className="my-2 text-2xl font-bold">
              {activeDay?.name ?? "Entrenamiento"}
            </h2>
            <p>
              {activeRoutine?.name} ·{" "}
              {findExercise(snapshot, workout.entries[workout.index]?.id ?? "")
                ?.name ?? ""}
            </p>
          </div>
          <Link href="/workout" className="primary-link">
            {t("Continuar", "Continue")}
          </Link>
        </section>
      ) : (
        <Button className="mb-5 w-full" onClick={() => setQuick(true)}>
          {t("Iniciar entrenamiento", "Start workout")}
        </Button>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("Mis rutinas", "My routines")}</h2>
        <Button variant="secondary" onClick={() => openEditor({ type: "new" })}>
          ＋ {t("Nueva", "New")}
        </Button>
      </div>
      {snapshot.routines.map((routine) => (
        <details
          className="panel routine-card"
          key={routine.id}
          open={routine.id === selected?.id}
        >
          <summary className="routine-heading">
            <span className="routine-title">
              <span className="font-bold">{routine.name}</span>
              <span className="routine-title-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xl"
                  className="routine-icon-control"
                  aria-label={`Renombrar ${routine.name}`}
                  title={t("Cambiar nombre", "Rename")}
                  onClick={(event) => {
                    event.preventDefault();
                    openEditor(
                      { type: "rename", rid: routine.id },
                      routine.name,
                    );
                  }}
                >
                  <Pencil data-icon="inline-start" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xl"
                  className="routine-icon-control"
                  aria-label={t("Compartir rutina", "Share routine")}
                  title={t("Compartir rutina", "Share routine")}
                  onClick={(event) => {
                    event.preventDefault();
                    try {
                      setShare(
                        `${location.origin}/#routine=${encodeRoutine(snapshot, routine)}`,
                      );
                    } catch (error) {
                      notify(
                        error instanceof Error
                          ? error.message
                          : "No se pudo compartir",
                      );
                    }
                  }}
                >
                  <Share data-icon="inline-start" />
                </Button>
                <Switch.Root
                  nativeButton
                  render={<button type="button" />}
                  className="routine-switch"
                  aria-label={`${t("Activar rutina", "Activate routine")}: ${routine.name}`}
                  title={
                    snapshot.selected === routine.id
                      ? t("Desactivar rutina", "Deactivate routine")
                      : t("Activar rutina", "Activate routine")
                  }
                  checked={snapshot.selected === routine.id}
                  onClick={(event) => event.stopPropagation()}
                  onCheckedChange={(checked) =>
                    change((draft) => {
                      draft.selected = checked ? routine.id : null;
                    })
                  }
                >
                  <Switch.Thumb className="routine-switch-thumb" />
                </Switch.Root>
              </span>
            </span>
            <span className="routine-delete-group">
              <small>
                {routine.days.length} {t("días", "days")}
              </small>
              <Button
                type="button"
                variant="destructive-solid"
                size="icon-xl"
                className="routine-delete routine-icon-control"
                aria-label={t("Eliminar rutina", "Delete routine")}
                title={t("Eliminar rutina", "Delete routine")}
                onClick={(event) => {
                  event.preventDefault();
                  setDeletingRoutine(routine.id);
                }}
              >
                <Trash2 data-icon="inline-start" />
              </Button>
            </span>
          </summary>
          <SortableDays
            rid={routine.id}
            ids={routine.days.map((day) => day.id)}
          >
            {routine.days.map((day) => (
              <SortableDay
                key={day.id}
                id={day.id}
                title={
                  <>
                    {day.name} <small>({day.items.length})</small>
                  </>
                }
              >
                <SortableExercises rid={routine.id} did={day.id} />
                <div className="my-3 flex flex-wrap justify-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      openEditor(
                        { type: "rename-day", rid: routine.id, did: day.id },
                        day.name,
                      )
                    }
                    aria-label={`${t("Renombrar", "Rename")} ${day.name}`}
                  >
                    <Pencil data-icon="inline-start" />
                    {t("Renombrar", "Rename")}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => setPicker({ rid: routine.id, did: day.id })}
                  >
                    {t("Agregar ejercicios", "Add exercises")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSuperset({ rid: routine.id, did: day.id });
                      setMembers([]);
                    }}
                  >
                    {t("Superseries", "Supersets")}
                  </Button>
                  <Button
                    onClick={() => begin(routine.id, day.id)}
                    disabled={!!workout}
                  >
                    {t("Empezar", "Start")}
                  </Button>
                </div>
                {!!day.supersets?.length && (
                  <p className="mb-3 text-sm text-orange-300">
                    {day.supersets
                      .map((group) =>
                        group
                          .map((id) => findExercise(snapshot, id)?.name ?? id)
                          .join(" + "),
                      )
                      .join(" · ")}
                  </p>
                )}
              </SortableDay>
            ))}
          </SortableDays>
          <div className="routine-day-actions">
            <Button
              variant="destructive-solid"
              disabled={!routine.days.length}
              onClick={() => setRemovingDay({ rid: routine.id })}
            >
              {t("Quitar día", "Remove day")}
            </Button>
            <Button
              variant="secondary"
              className="routine-add-day"
              onClick={() => openEditor({ type: "day", rid: routine.id })}
            >
              {t("Agregar día", "Add day")}
            </Button>
          </div>
        </details>
      ))}
      {!snapshot.routines.length && (
        <p className="panel">
          {t("Creá tu primera rutina.", "Create your first routine.")}
        </p>
      )}
      <CalendarPanel />
      <div className="home-section-shortcuts">
        <Link href="/library" className="home-section-shortcut">
          <LibraryBig aria-hidden="true" />
          <strong>{t("Biblioteca", "Library")}</strong>
        </Link>
        <Link href="/progress" className="home-section-shortcut">
          <ChartNoAxesCombined aria-hidden="true" />
          <strong>{t("Progreso", "Progress")}</strong>
        </Link>
      </div>
      <AppDialog
        open={quick}
        onClose={() => setQuick(false)}
        title={t("Elegir día para entrenar", "Choose training day")}
      >
        {!snapshot.routines.some(
          (routine) => routine.id === snapshot.selected,
        ) && (
          <p>
            {t(
              "Activá una rutina para elegir un día de entrenamiento.",
              "Activate a routine to choose a training day.",
            )}
          </p>
        )}
        {snapshot.routines
          .filter((routine) => routine.id === snapshot.selected)
          .flatMap((routine) =>
            routine.days.map((day) => (
              <Button
                key={day.id}
                variant="secondary"
                disabled={!day.items.length}
                onClick={() => begin(routine.id, day.id)}
              >
                {routine.name} · {day.name}
              </Button>
            )),
          )}
      </AppDialog>
      <AppDialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        compactHeader={editor?.type === "new" && mode === "auto"}
        titleAction={
          editor?.type === "new" && mode === "auto" ? (
            <Button
              type="button"
              variant="secondary"
              className="automatic-select-all"
              size="sm"
              onClick={() =>
                setGroups(
                  groups.length === muscleGroups.length
                    ? []
                    : [...muscleGroups],
                )
              }
            >
              {groups.length === muscleGroups.length
                ? t("Deseleccionar todo", "Deselect all")
                : t("Seleccionar todo", "Select all")}
            </Button>
          ) : undefined
        }
        title={
          editor?.type === "rename-day"
            ? t("Cambiar nombre del día", "Rename workout day")
            : editor?.type === "rename"
              ? "Renombrar rutina"
              : editor?.type === "day"
                ? "Agregar día"
                : "Nueva rutina"
        }
      >
        {editor?.type === "new" && mode === "choose" ? (
          <>
            <Button onClick={() => setMode("custom")}>
              {t("Rutina personalizada", "Custom routine")}
            </Button>
            <Button variant="secondary" onClick={() => setMode("auto")}>
              {t("Rutina automática", "Automatic routine")}
            </Button>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const editing = editor;
              if (!editing) return;
              if (mode !== "auto" && !name.trim())
                return notify("Escribí un nombre.");
              if (
                change((draft) => {
                  if (editing.type === "rename") {
                    const routine = draft.routines.find(
                      (item) => item.id === editing.rid,
                    );
                    if (routine) routine.name = name.trim();
                  } else if (editing.type === "rename-day") {
                    const day = draft.routines
                      .find((item) => item.id === editing.rid)
                      ?.days.find((item) => item.id === editing.did);
                    if (day) day.name = name.trim();
                  } else if (editing.type === "day")
                    draft.routines
                      .find((item) => item.id === editing.rid)
                      ?.days.push({
                        id: crypto.randomUUID(),
                        name: name.trim(),
                        items: [],
                      });
                  else {
                    const routine =
                      mode === "auto"
                        ? buildAutomaticRoutine(
                            { groups, days },
                            {
                              makeId: () => crypto.randomUUID(),
                              language: draft.settings.language ?? "es",
                            },
                          )
                        : {
                            id: crypto.randomUUID(),
                            name: name.trim(),
                            goal,
                            days: [],
                          };
                    draft.routines.push(routine);
                    draft.selected = routine.id;
                  }
                })
              ) {
                setEditor(null);
                notify(t("Rutina guardada", "Routine saved"));
              }
            }}
          >
            {editor?.type === "new" && mode === "custom" && (
              <label className="block">
                {t("Objetivo", "Goal")}
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                >
                  {[
                    ["Fuerza e hipertrofia", "Strength and hypertrophy"],
                    ["Ganar masa muscular", "Build muscle"],
                    ["Mejorar condición física", "Improve fitness"],
                  ].map(([es, en]) => (
                    <option key={es} value={es}>
                      {t(es!, en!)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "auto" ? (
              <>
                <div className="automatic-muscle-picker">
                  <div className="automatic-muscle-grid">
                    {muscleGroups.map((group) => (
                      <label
                        key={group}
                        className="automatic-muscle-card"
                        data-selected={groups.includes(group)}
                      >
                        <input
                          type="checkbox"
                          checked={groups.includes(group)}
                          onChange={() =>
                            setGroups((previous) =>
                              previous.includes(group)
                                ? previous.filter((item) => item !== group)
                                : [...previous, group],
                            )
                          }
                        />
                        <img
                          src={`/assets/${muscleImages[group]}`}
                          alt=""
                          width={140}
                          height={120}
                        />
                        <span>
                          {t(
                            group,
                            {
                              Pectorales: "Chest",
                              Espalda: "Back",
                              Hombros: "Shoulders",
                              Bíceps: "Biceps",
                              Tríceps: "Triceps",
                              Abdominales: "Abs",
                              Piernas: "Legs",
                              Gemelos: "Calves",
                            }[group],
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="automatic-days">
                  {t("Días por semana", "Days per week")}
                  <span className="automatic-days-select">
                    <select
                      value={days}
                      onChange={(event) => setDays(Number(event.target.value))}
                    >
                      {Array.from({ length: 7 }, (_, index) => (
                        <option key={index} value={index + 1}>
                          {index + 1}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
              </>
            ) : (
              <label className="block">
                {t("Nombre", "Name")}
                <Input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
            <Button type="submit">
              {mode === "auto"
                ? t("Crear rutina", "Create routine")
                : t("Guardar", "Save")}
            </Button>
          </form>
        )}
      </AppDialog>
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(null)}
          onPick={(ids) => {
            if (
              change((draft) => {
                draft.routines
                  .find((item) => item.id === picker.rid)
                  ?.days.find((item) => item.id === picker.did)
                  ?.items.push(...ids);
              })
            )
              setPicker(null);
          }}
        />
      )}
      <AppDialog
        open={superset !== null}
        onClose={() => setSuperset(null)}
        title="Superseries"
      >
        {snapshot.routines
          .find((routine) => routine.id === superset?.rid)
          ?.days.find((day) => day.id === superset?.did)
          ?.items.map((id, index) => (
            <label key={index} className="flex min-h-12 items-center gap-3">
              <input
                type="checkbox"
                checked={members.includes(id)}
                onChange={() =>
                  setMembers((previous) =>
                    previous.includes(id)
                      ? previous.filter((item) => item !== id)
                      : [...previous, id],
                  )
                }
              />
              {findExercise(snapshot, id)?.name ?? id}
            </label>
          ))}
        <Button
          disabled={members.length < 2}
          onClick={() => {
            if (
              change((draft) => {
                const day = draft.routines
                  .find((routine) => routine.id === superset?.rid)
                  ?.days.find((day) => day.id === superset?.did);
                if (day)
                  day.supersets = [
                    ...(day.supersets ?? []).filter(
                      (group) => !group.some((id) => members.includes(id)),
                    ),
                    members,
                  ];
              })
            )
              setSuperset(null);
          }}
        >
          {t("Crear superserie", "Create superset")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            change((draft) => {
              const day = draft.routines
                .find((routine) => routine.id === superset?.rid)
                ?.days.find((day) => day.id === superset?.did);
              if (day) day.supersets = [];
            });
            setSuperset(null);
          }}
        >
          {t(
            "Quitar superseries de este día",
            "Remove supersets from this day",
          )}
        </Button>
      </AppDialog>
      <AppDialog
        open={!!share}
        onClose={() => setShare("")}
        title="Compartir rutina"
        description="Se comparte una copia editable; no tu perfil, historial, pesos ni notas privadas."
      >
        <Input
          aria-label={t("Enlace de rutina", "Routine link")}
          readOnly
          value={share}
        />
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(share);
              notify("Enlace copiado");
            } catch {
              notify("Seleccioná el enlace para copiarlo manualmente.");
            }
          }}
        >
          {t("Copiar enlace", "Copy link")}
        </Button>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button
            variant="secondary"
            onClick={() => {
              void navigator
                .share({ url: share, title: "FITTY" })
                .catch(() => {});
            }}
          >
            {t("Compartir…", "Share…")}
          </Button>
        )}
      </AppDialog>
      <AppDialog
        open={!!incoming}
        onClose={() => {
          setIncoming("");
          sessionStorage.removeItem(INCOMING_ROUTINE_KEY);
        }}
        title={t("Rutina compartida", "Shared routine")}
      >
        <p>
          {t(
            "Se agregará una copia editable sin modificar tus rutinas actuales.",
            "An editable copy will be added without changing your current routines.",
          )}
        </p>
        <Button
          onClick={() => {
            if (change((draft) => importRoutine(draft, incoming))) {
              setIncoming("");
              sessionStorage.removeItem(INCOMING_ROUTINE_KEY);
              notify("Rutina agregada a tu cuenta");
            }
          }}
        >
          {t("Agregar a mis rutinas", "Add to my routines")}
        </Button>
      </AppDialog>
    </>
  );
}
