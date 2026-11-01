import { useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { menstrualCalendarEnabled } from "@fitty/core/domain/menstrual-calendar";
import {
  localDateKey,
  startWorkout,
  type Session,
} from "@fitty/core/domain/workouts";
import { Calendar } from "@/components/calendar";
import { DaySheet } from "@/components/day-sheet";
import { Notice } from "@/components/notice";
import { ReadinessCheck } from "@/components/readiness";
import { Button, Card, Label, Screen } from "@/components/ui";
import { RoutinesSection } from "@/app/(app)/routines";
import { useAccount, useSnapshot } from "@/state/account";
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
  const [copied, setCopied] = useState<Session[]>([]);
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
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                color: colors.primary,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1,
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
            <Label muted>{activeRoutine?.name}</Label>
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
      {copied.length ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space(3),
            padding: space(3),
            borderRadius: 16,
            borderColor: "#2b6a8f",
            borderWidth: 1,
            backgroundColor: "#10283a",
          }}
        >
          <Label style={{ flex: 1 }}>
            {t(
              "Entrenamiento copiado. Tocá un día del calendario y pegalo.",
              "Workout copied. Tap a calendar day and paste it.",
            )}
          </Label>
          <Pressable accessibilityRole="button" onPress={() => setCopied([])}>
            <Text style={{ color: colors.accent, fontWeight: "800" }}>
              {t("Cancelar", "Cancel")}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
        <View style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={() => setPicking(false)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View>
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
          </View>
        </View>
      </Modal>
      <DaySheet
        day={day}
        onClose={() => setDay(null)}
        copied={copied}
        onCopied={setCopied}
      />
      <ReadinessCheck
        visible={pending !== null}
        onClose={() => setPending(null)}
        onStart={() => pending && start(pending.rid, pending.did)}
      />
    </Screen>
  );
}
