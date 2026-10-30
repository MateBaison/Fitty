import { useRouter } from "expo-router";
import { View } from "react-native";
import { weeklySummary } from "@fitty/core/domain/progress";
import { startWorkout } from "@fitty/core/domain/workouts";
import { Notice } from "@/components/notice";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";

export default function Home() {
  const snapshot = useSnapshot();
  const { change, t } = useAccount();
  const router = useRouter();
  const week = weeklySummary(snapshot);
  const routine =
    snapshot.routines.find((item) => item.id === snapshot.selected) ??
    snapshot.routines[0];
  const name = snapshot.profile.name?.trim();
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>{name ? `${t("Hola", "Hi")}, ${name}` : t("Hola", "Hi")}</Title>
        <SyncStatus />
      </View>
      <Notice />
      {snapshot.workout ? (
        <Card>
          <Label>
            {t(
              "Tenés un entrenamiento en curso.",
              "You have a workout in progress.",
            )}
          </Label>
          <Button onPress={() => router.push("/workout")}>
            {t("Continuar entrenamiento", "Continue workout")}
          </Button>
        </Card>
      ) : null}
      <Card>
        <Label muted>{t("Esta semana", "This week")}</Label>
        <Label>
          {week.sessions} {t("entrenamientos", "workouts")} · {week.trainedDays}{" "}
          {t("días", "days")}
        </Label>
      </Card>
      {!snapshot.profile.onboardingComplete && !name ? (
        <Card>
          <Label>
            {t(
              "Completá tu perfil y creá tu primera rutina en fitty.uy.",
              "Complete your profile and create your first routine at fitty.uy.",
            )}
          </Label>
        </Card>
      ) : null}
      {routine ? (
        <View style={{ gap: 12 }}>
          <Label muted>{routine.name}</Label>
          {routine.days.map((day) => (
            <Card key={day.id}>
              <Label>{day.name}</Label>
              <Label muted>
                {day.items.length} {t("ejercicios", "exercises")}
              </Label>
              <Button
                variant="secondary"
                disabled={Boolean(snapshot.workout) || !day.items.length}
                onPress={() => {
                  if (
                    change((draft) => startWorkout(draft, routine.id, day.id))
                  )
                    router.push("/workout");
                }}
              >
                {t("Empezar", "Start")}
              </Button>
            </Card>
          ))}
        </View>
      ) : (
        <Card>
          <Label>
            {t("Todavía no tenés rutinas.", "You don't have routines yet.")}
          </Label>
        </Card>
      )}
    </Screen>
  );
}
