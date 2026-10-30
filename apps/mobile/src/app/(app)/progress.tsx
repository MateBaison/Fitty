import { View } from "react-native";
import { lifetimeSummary, weeklySummary } from "@fitty/core/domain/progress";
import { Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";

const KG_TO_LB = 2.20462;

export default function Progress() {
  const snapshot = useSnapshot();
  const { t } = useAccount();
  const locale = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  const volume = (kg: number) =>
    `${Math.round(unit === "lb" ? kg * KG_TO_LB : kg).toLocaleString(locale)} ${unit}`;
  const week = weeklySummary(snapshot);
  const total = lifetimeSummary(snapshot);
  const sessions = [...snapshot.sessions]
    .filter((session) => Number.isFinite(Date.parse(session.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 30);
  return (
    <Screen>
      <Title>{t("Progreso", "Progress")}</Title>
      <Card>
        <Label muted>{t("Esta semana", "This week")}</Label>
        <Label>
          {week.sessions} {t("entrenamientos", "workouts")} · {week.minutes} min
        </Label>
        <Label>
          {t("Volumen", "Volume")}: {volume(week.volumeKg)}
        </Label>
      </Card>
      <Card>
        <Label muted>{t("Desde el comienzo", "All time")}</Label>
        <Label>
          {total.sessions} {t("entrenamientos", "workouts")} ·{" "}
          {total.trainedDays} {t("días entrenados", "training days")}
        </Label>
        <Label>
          {t("Volumen", "Volume")}: {volume(total.volumeKg)}
        </Label>
      </Card>
      <View style={{ gap: 12 }}>
        <Label muted>{t("Historial", "History")}</Label>
        {sessions.length ? (
          sessions.map((session) => (
            <Card key={session.id}>
              <Label>
                {session.day} · {session.routine}
              </Label>
              <Label muted>
                {new Date(session.date).toLocaleDateString(locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {session.duration != null ? ` · ${session.duration} min` : ""}
                {session.sets
                  ? ` · ${session.sets} ${t("series", "sets")}`
                  : ""}
              </Label>
              {session.comment ? <Label muted>{session.comment}</Label> : null}
            </Card>
          ))
        ) : (
          <Card>
            <Label>
              {t(
                "Todavía no registraste entrenamientos.",
                "You haven't logged workouts yet.",
              )}
            </Label>
          </Card>
        )}
      </View>
    </Screen>
  );
}
