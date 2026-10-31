import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { menstrualCalendarEnabled } from "@fitty/core/domain/menstrual-calendar";
import { weeklySummary } from "@fitty/core/domain/progress";
import { startWorkout } from "@fitty/core/domain/workouts";
import { Notice } from "@/components/notice";
import { ReadinessCheck } from "@/components/readiness";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

export default function Home() {
  const snapshot = useSnapshot();
  const { change, t } = useAccount();
  const router = useRouter();
  const [pending, setPending] = useState<{ rid: string; did: string } | null>(
    null,
  );
  const start = (rid: string, did: string) => {
    setPending(null);
    if (change((draft) => startWorkout(draft, rid, did)))
      router.push("/workout");
  };
  const week = weeklySummary(snapshot);
  const routine =
    snapshot.routines.find((item) => item.id === snapshot.selected) ??
    snapshot.routines[0];
  const name = snapshot.profile.name?.trim();
  const today = new Date().toLocaleDateString(snapshot.settings.language ?? "es", {
    day: "numeric",
    month: "short",
  });
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Image
          source={require("@/assets/images/fitty-wordmark.png")}
          style={{ width: 88, height: 42 }}
          resizeMode="contain"
          accessibilityLabel="Fitty"
        />
        <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
          {today}
        </Text>
      </View>
      <View style={{ gap: 4 }}>
        <Title>{name ? `${t("Hola", "Hi")}, ${name}` : t("Hola", "Hi")}</Title>
        <SyncStatus />
      </View>
      <Notice />
      {snapshot.workout ? (
        <Button onPress={() => router.push("/workout")}>
          {t("Continuar entrenamiento", "Continue workout")}
        </Button>
      ) : null}
      <Card style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Label muted>{t("Entrenamientos", "Workouts")}</Label>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>
            {week.sessions}
          </Text>
          <Label muted>{t("esta semana", "this week")}</Label>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Label muted>{t("Días activos", "Active days")}</Label>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>
            {week.trainedDays}
          </Text>
          <Label muted>{t("esta semana", "this week")}</Label>
        </View>
      </Card>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: space(2),
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
          {t("Mis rutinas", "My routines")}
        </Text>
        <View style={{ minWidth: 120 }}>
          <Button variant="secondary" onPress={() => router.push("/routines")}>
            {t("Ver todas", "See all")}
          </Button>
        </View>
      </View>
      {routine ? (
        <View style={{ gap: space(3) }}>
          <Label muted>{routine.name}</Label>
          {routine.days.map((day) => (
            <Card key={day.id}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space(3),
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {day.name}
                </Text>
                <Label muted>
                  {day.items.length} {t("ejercicios", "exercises")}
                </Label>
              </View>
              <Button
                disabled={Boolean(snapshot.workout) || !day.items.length}
                onPress={() =>
                  menstrualCalendarEnabled(snapshot.profile)
                    ? setPending({ rid: routine.id, did: day.id })
                    : start(routine.id, day.id)
                }
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
      <ReadinessCheck
        visible={pending !== null}
        onClose={() => setPending(null)}
        onStart={() => pending && start(pending.rid, pending.did)}
      />
    </Screen>
  );
}
