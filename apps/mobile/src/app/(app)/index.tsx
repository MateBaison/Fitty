import { useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { menstrualCalendarEnabled } from "@fitty/core/domain/menstrual-calendar";
import {
  findExercise,
  localDateKey,
  sessionsOnDay,
  startWorkout,
} from "@fitty/core/domain/workouts";
import { Calendar } from "@/components/calendar";
import { ManualSession } from "@/components/manual-session";
import { Notice } from "@/components/notice";
import { ReadinessCheck } from "@/components/readiness";
import { Button, Card, Label, Screen } from "@/components/ui";
import { RoutinesSection } from "@/app/(app)/routines";
import { useAccount, useSnapshot } from "@/state/account";
import { translate } from "@fitty/core/data/translations";
import { colors, space } from "@/theme";

function Tile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 140,
        borderRadius: 24,
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        gap: space(3),
      }}
    >
      <SymbolView name={icon} tintColor={colors.primary} size={34} />
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const snapshot = useSnapshot();
  const { change, t } = useAccount();
  const router = useRouter();
  const locale = snapshot.settings.language ?? "es";
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<{ rid: string; did: string } | null>(
    null,
  );
  const [day, setDay] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const start = (rid: string, did: string) => {
    setPending(null);
    setPicking(false);
    if (change((draft) => startWorkout(draft, rid, did)))
      router.push("/workout");
  };
  const routine = snapshot.routines.find(
    (item) => item.id === snapshot.selected,
  );
  const activeRoutine = snapshot.routines.find(
    (item) => item.id === snapshot.workout?.rid,
  );
  const activeDay = activeRoutine?.days.find(
    (item) => item.id === snapshot.workout?.did,
  );
  const sessions = day ? sessionsOnDay(snapshot.sessions, day) : [];
  return (
    <Screen>
      <Notice />
      {snapshot.workout ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space(3),
            borderRadius: 24,
            borderColor: "#2b6a8f",
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            borderWidth: 1,
            backgroundColor: "#10283a",
            padding: space(4),
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              ● {t("Entrenamiento en curso", "Workout in progress")}
            </Text>
            <Text
              style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}
            >
              {activeDay?.name ?? t("Entrenamiento", "Workout")}
            </Text>
            <Label muted>
              {activeRoutine?.name} ·{" "}
              {(() => {
                const current = findExercise(
                  snapshot,
                  snapshot.workout.entries[snapshot.workout.index]?.id ?? "",
                );
                return current
                  ? translate(locale, current.name, current.name)
                  : "";
              })()}
            </Label>
          </View>
          <View style={{ minWidth: 112 }}>
            <Button onPress={() => router.navigate("/workout")}>
              {t("Continuar", "Continue")}
            </Button>
          </View>
        </View>
      ) : (
        <Button onPress={() => setPicking(true)}>
          {t("Iniciar entrenamiento", "Start workout")}
        </Button>
      )}
      <RoutinesSection />
      <Card>
        <Calendar selected={day ?? localDateKey(new Date())} onSelect={setDay} />
      </Card>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <Tile
          label={t("Biblioteca", "Library")}
          icon={{ ios: "books.vertical", android: "library_books" }}
          onPress={() => router.navigate("/library")}
        />
        <Tile
          label={t("Progreso", "Progress")}
          icon={{ ios: "chart.line.uptrend.xyaxis", android: "show_chart" }}
          onPress={() => router.navigate("/progress")}
        />
      </View>
      <Modal
        visible={picking}
        transparent
        animationType="fade"
        onRequestClose={() => setPicking(false)}
      >
        <Pressable
          onPress={() => setPicking(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                {t("Elegir día para entrenar", "Choose training day")}
              </Text>
              {routine ? (
                routine.days.map((item) => (
                  <Button
                    key={item.id}
                    variant="secondary"
                    disabled={!item.items.length}
                    onPress={() =>
                      menstrualCalendarEnabled(snapshot.profile)
                        ? (setPicking(false),
                          setPending({ rid: routine.id, did: item.id }))
                        : start(routine.id, item.id)
                    }
                  >
                    {`${routine.name} · ${item.name}`}
                  </Button>
                ))
              ) : (
                <Label muted>
                  {t(
                    "Activá una rutina para elegir un día de entrenamiento.",
                    "Activate a routine to choose a training day.",
                  )}
                </Label>
              )}
              <Button variant="ghost" onPress={() => setPicking(false)}>
                {t("Cancelar", "Cancel")}
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={day !== null && !logging}
        transparent
        animationType="fade"
        onRequestClose={() => setDay(null)}
      >
        <Pressable
          onPress={() => setDay(null)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "800",
                  textTransform: "capitalize",
                }}
              >
                {day
                  ? new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : ""}
              </Text>
              {sessions.length ? (
                sessions.map((session) => (
                  <View
                    key={session.id}
                    style={{
                      borderRadius: 14,
                      borderColor: colors.border,
                      borderWidth: 1,
                      backgroundColor: colors.secondary,
                      padding: space(3),
                      gap: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontWeight: "800",
                        fontSize: 16,
                      }}
                    >
                      {session.day}
                    </Text>
                    <Label muted>{session.routine}</Label>
                    <Label muted>
                      {session.duration != null
                        ? `${session.duration} min · `
                        : ""}
                      {Math.round(session.volumeKg ?? session.volume ?? 0)} kg
                    </Label>
                  </View>
                ))
              ) : (
                <Label muted>
                  {t("Sin entrenamientos este día.", "No workouts this day.")}
                </Label>
              )}
              {day && day <= localDateKey(new Date()) ? (
                <Button onPress={() => setLogging(true)}>
                  {t(
                    "Agregar entrenamiento a este día",
                    "Add a workout to this day",
                  )}
                </Button>
              ) : null}
              <Button variant="secondary" onPress={() => setDay(null)}>
                {t("Cerrar", "Close")}
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
      <ManualSession
        date={day ?? localDateKey(new Date())}
        visible={logging}
        onClose={() => {
          setLogging(false);
          setDay(null);
        }}
      />
      <ReadinessCheck
        visible={pending !== null}
        onClose={() => setPending(null)}
        onStart={() => pending && start(pending.rid, pending.did)}
      />
    </Screen>
  );
}
