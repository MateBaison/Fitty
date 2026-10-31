import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { menstrualCalendarEnabled } from "@fitty/core/domain/menstrual-calendar";
import { lifetimeSummary, weeklySummary } from "@fitty/core/domain/progress";
import {
  findExercise,
  localDateKey,
  sessionsOnDay,
} from "@fitty/core/domain/workouts";
import { translate } from "@fitty/core/data/translations";
import { Calendar } from "@/components/calendar";
import { ManualSession } from "@/components/manual-session";
import { TextPrompt } from "@/components/prompt";
import { Button, Card, Label, Screen } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const KG_TO_LB = 2.20462;
const bigNumber = {
  color: colors.foreground,
  fontSize: 32,
  fontWeight: "800" as const,
};

export default function Progress() {
  const snapshot = useSnapshot();
  const { change, t } = useAccount();
  const router = useRouter();
  const locale = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const [day, setDay] = useState(() => localDateKey(new Date()));
  const [editing, setEditing] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const volume = (kg: number) =>
    `${Math.round(unit === "lb" ? kg * KG_TO_LB : kg).toLocaleString(locale)} ${unit}`;
  const week = weeklySummary(snapshot);
  const total = lifetimeSummary(snapshot);
  const sessions = sessionsOnDay(snapshot.sessions, day);
  const comment = snapshot.sessions.find(
    (session) => session.id === editing,
  )?.comment;
  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <Card style={{ flex: 1 }}>
          <Label muted>{t("Esta semana", "This week")}</Label>
          <Text style={bigNumber}>{week.sessions}</Text>
          <Label muted>{t("entrenamientos", "workouts")}</Label>
          <Label>{week.minutes} min</Label>
          <Label>{volume(week.volumeKg)}</Label>
        </Card>
        <Card style={{ flex: 1 }}>
          <Label muted>{t("Desde el comienzo", "All time")}</Label>
          <Text style={bigNumber}>{total.sessions}</Text>
          <Label muted>{t("entrenamientos", "workouts")}</Label>
          <Label>
            {total.trainedDays} {t("días", "days")}
          </Label>
          <Label>{volume(total.volumeKg)}</Label>
        </Card>
      </View>
      <Button variant="secondary" onPress={() => router.push("/body")}>
        {t("Medidas corporales", "Body measurements")}
      </Button>
      <Card>
        <Calendar selected={day} onSelect={setDay} />
      </Card>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 18,
          fontWeight: "800",
          textTransform: "capitalize",
        }}
      >
        {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </Text>
      {menstrualCalendarEnabled(snapshot.profile) ? (
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}
        >
          <Label style={{ flex: 1 }}>
            {t("Sangrado menstrual este día", "Menstrual bleeding this day")}
          </Label>
          <Switch
            accessibilityLabel={t(
              "Sangrado menstrual este día",
              "Menstrual bleeding this day",
            )}
            value={
              snapshot.profile.menstrualCalendar?.dates?.includes(day) === true
            }
            trackColor={{ true: "#f472b6", false: colors.secondary }}
            onValueChange={(marked) =>
              void change((draft) => {
                const dates = new Set(
                  draft.profile.menstrualCalendar?.dates ?? [],
                );
                if (marked) dates.add(day);
                else dates.delete(day);
                draft.profile.menstrualCalendar = {
                  ...draft.profile.menstrualCalendar,
                  dates: [...dates].sort(),
                };
              })
            }
          />
        </View>
      ) : null}
      {day <= localDateKey(new Date()) ? (
        <Button variant="success" onPress={() => setLogging(true)}>
          {t("+ Registrar entrenamiento", "+ Log workout")}
        </Button>
      ) : null}
      {sessions.length ? (
        sessions.map((session) => (
          <Card key={session.id}>
            <Text
              style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}
            >
              {session.day} · {session.routine}
            </Text>
            <Label muted>
              {session.duration != null ? `${session.duration} min · ` : ""}
              {session.sets ?? 0} {t("series", "sets")} ·{" "}
              {volume(session.volumeKg ?? session.volume ?? 0)}
            </Label>
            {(session.exercises ?? []).map((exercise, index) => {
              const known = findExercise(snapshot, exercise.id);
              const sets = exercise.performedSets ?? [];
              return (
                <Label muted key={`${exercise.id}-${index}`}>
                  {known
                    ? translate(locale, known.name, known.name)
                    : exercise.id}
                  {sets.length
                    ? `: ${sets
                        .map(
                          (set) =>
                            `${set.kg ?? 0}×${set.reps ?? (set.seconds != null ? `${set.seconds}s` : "")}`,
                        )
                        .join(", ")}`
                    : exercise.sets
                      ? `: ${exercise.sets} ${t("series", "sets")}`
                      : ""}
                </Label>
              );
            })}
            {session.comment ? <Label>{session.comment}</Label> : null}
            <View style={{ flexDirection: "row", gap: space(2) }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  onPress={() => setEditing(session.id)}
                >
                  {t("Comentario", "Comment")}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="destructive"
                  onPress={() =>
                    Alert.alert(
                      t("¿Eliminar entrenamiento?", "Delete workout?"),
                      t(
                        "Esta acción no se puede deshacer.",
                        "This can't be undone.",
                      ),
                      [
                        { text: t("Cancelar", "Cancel"), style: "cancel" },
                        {
                          text: t("Eliminar", "Delete"),
                          style: "destructive",
                          onPress: () =>
                            change((draft) => {
                              draft.sessions = draft.sessions.filter(
                                (item) => item.id !== session.id,
                              );
                            }),
                        },
                      ],
                    )
                  }
                >
                  {t("Eliminar", "Delete")}
                </Button>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Label muted>
            {t("Sin entrenamientos este día.", "No workouts this day.")}
          </Label>
        </Card>
      )}
      <ManualSession
        date={day}
        visible={logging}
        onClose={() => setLogging(false)}
      />
      <TextPrompt
        visible={editing !== null}
        title={t("Comentario", "Comment")}
        label={t("Comentario", "Comment")}
        initial={comment ?? ""}
        maxLength={2000}
        confirm={t("Guardar", "Save")}
        cancel={t("Cancelar", "Cancel")}
        onClose={() => setEditing(null)}
        onSubmit={(value) => {
          if (
            change((draft) => {
              const session = draft.sessions.find(
                (item) => item.id === editing,
              );
              if (session) session.comment = value;
            })
          )
            setEditing(null);
        }}
      />
    </Screen>
  );
}
