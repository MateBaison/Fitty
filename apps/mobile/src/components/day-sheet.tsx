import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import type Svg from "react-native-svg";
import { localizedSetTypes } from "@fitty/core/data/set-types";
import { translate } from "@fitty/core/data/translations";
import {
  copySessions,
  findExercise,
  localDateKey,
  sessionsOnDay,
  setNumber,
  type Session,
} from "@fitty/core/domain/workouts";
import { ManualSession } from "@/components/manual-session";
import { WorkoutPoster } from "@/components/workout-poster";
import { Button, Card, Label } from "@/components/ui";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

const typeColor: Record<string, string> = {
  warmup: "#facc15",
  normal: "#4ade80",
  failure: "#fb7185",
  drop: "#38bdf8",
  pyramid: "#c084fc",
};

function Overlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}
      >
        <Pressable onPress={() => undefined} style={{ maxHeight: "92%" }}>
          <Card>{children}</Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function IconButton({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: { ios: string; android: string };
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: danger ? colors.destructive : colors.secondary,
        borderColor: colors.border,
        borderWidth: danger ? 0 : 1,
      }}
    >
      <SymbolView
        name={icon as never}
        tintColor={danger ? "#ffffff" : colors.accent}
        size={20}
      />
    </Pressable>
  );
}

/**
 * Day dialog of the calendar: the workouts of a date, a detail view with the
 * logged sets, and copy, share and delete actions.
 */
export function DaySheet({
  day,
  onClose,
  copied,
  onCopied,
}: {
  day: string | null;
  onClose: () => void;
  copied: Session[];
  onCopied: (sessions: Session[]) => void;
}) {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const locale = language;
  const unit = snapshot.settings.weight ?? "kg";
  const factor = unit === "lb" ? 2.20462 : 1;
  const [detailId, setDetailId] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [poster, setPoster] = useState<Session | null>(null);
  const posterRef = useRef<Svg>(null);
  const sessions = day ? sessionsOnDay(snapshot.sessions, day) : [];
  const detail = snapshot.sessions.find((session) => session.id === detailId) ?? null;
  const types = localizedSetTypes(language);
  const volume = (session: Session) =>
    session.volumeKg == null && session.volume == null
      ? t("Sin registro", "Not recorded")
      : `${Math.round((session.volumeKg ?? (session.volume ?? 0) / (session.weightUnit === "lb" ? 2.20462 : 1)) * factor).toLocaleString(locale)} ${unit}`;
  const time = (session: Session) =>
    session.duration == null
      ? t("Sin registro", "Not recorded")
      : `${session.duration >= 60 ? `${Math.floor(session.duration / 60)} h ` : ""}${Math.round(session.duration % 60)} min`;
  const closeAll = () => {
    setDetailId(null);
    setPoster(null);
    onClose();
  };
  const share = async () => {
    const svg = posterRef.current;
    if (!svg) return;
    try {
      const base64 = await new Promise<string>((accept) =>
        svg.toDataURL((data: string) => accept(data)),
      );
      const file = new File(Paths.cache, `fitty-entrenamiento-${Date.now()}.png`);
      file.create({ overwrite: true });
      file.write(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
      await Share.share({ url: file.uri });
    } catch {
      notify(t("No se pudo compartir la imagen.", "Could not share the image."));
    }
  };
  const paste = () => {
    if (!day) return;
    Alert.alert(
      t("Pegar entrenamientos", "Paste workouts"),
      t(
        "Se agregarán copias sin fotos ni pesos corporales, sin reemplazar lo existente. ¿Pegar?",
        "Copies without photos or body weights will be added without replacing existing workouts. Paste?",
      ),
      [
        { text: t("Cancelar", "Cancel"), style: "cancel" },
        {
          text: t("Pegar", "Paste"),
          onPress: () => {
            if (
              change((draft) => {
                draft.sessions.push(...copySessions(copied, day));
              })
            ) {
              onCopied([]);
              notify(t("Entrenamiento pegado", "Workout pasted"));
            }
          },
        },
      ],
    );
  };
  return (
    <>
      <Overlay visible={day !== null && !detail && !logging && !poster} onClose={closeAll}>
        <Text
          accessibilityRole="header"
          style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textTransform: "capitalize" }}
        >
          {day
            ? new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : ""}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
          {sessions.length ? (
            sessions.map((session) => (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                onPress={() => setDetailId(session.id)}
                style={{
                  borderRadius: 14,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderLeftWidth: 4,
                  borderLeftColor: session.color ?? colors.primary,
                  backgroundColor: colors.secondary,
                  padding: space(3),
                  gap: 2,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
                  {session.day}
                </Text>
                <Label muted>{session.routine}</Label>
                <Label muted>
                  {t("Tiempo", "Time")}: {time(session)} · {t("Volumen", "Volume")}: {volume(session)}
                </Label>
              </Pressable>
            ))
          ) : (
            <Label muted>
              {t("No hay entrenamientos guardados este día.", "No workouts saved for this day.")}
            </Label>
          )}
        </ScrollView>
        {copied.length ? (
          <Button variant="secondary" onPress={paste}>
            {t("Pegar entrenamientos copiados", "Paste copied workouts")}
          </Button>
        ) : null}
        {sessions.length > 1 ? (
          <Button
            variant="secondary"
            onPress={() => {
              onCopied(structuredClone(sessions));
              notify(t("Día copiado. Elegí otro día y pegalo.", "Day copied. Choose another day and paste it."));
              closeAll();
            }}
          >
            {t("Copiar todo el día", "Copy entire day")}
          </Button>
        ) : null}
        {day && day <= localDateKey(new Date()) ? (
          <Button onPress={() => setLogging(true)}>
            {t("Agregar entrenamiento a este día", "Add a workout to this day")}
          </Button>
        ) : null}
        <Button variant="secondary" onPress={closeAll}>
          {t("Cerrar", "Close")}
        </Button>
      </Overlay>
      <Overlay visible={detail !== null && !poster} onClose={() => setDetailId(null)}>
        {detail ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Volver", "Back")}
                onPress={() => setDetailId(null)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 24, fontWeight: "700" }}>‹</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <IconButton
                label={t("Copiar", "Copy")}
                icon={{ ios: "doc.on.doc", android: "content_copy" }}
                onPress={() => {
                  onCopied([structuredClone(detail)]);
                  void Haptics.selectionAsync();
                  notify(t("Copiado. Elegí otro día y pegalo.", "Copied. Choose another day and paste it."));
                  closeAll();
                }}
              />
              <IconButton
                label={t("Compartir imagen", "Share image")}
                icon={{ ios: "square.and.arrow.up", android: "share" }}
                onPress={() => setPoster(detail)}
              />
              <IconButton
                danger
                label={t("Eliminar", "Delete")}
                icon={{ ios: "trash.fill", android: "delete" }}
                onPress={() =>
                  Alert.alert(
                    t("¿Eliminar este entrenamiento?", "Delete this workout?"),
                    t("Esta acción no se puede deshacer.", "This can't be undone."),
                    [
                      { text: t("Cancelar", "Cancel"), style: "cancel" },
                      {
                        text: t("Eliminar", "Delete"),
                        style: "destructive",
                        onPress: () => {
                          change((draft) => {
                            draft.sessions = draft.sessions.filter(
                              (item) => item.id !== detail.id,
                            );
                          });
                          setDetailId(null);
                        },
                      },
                    ],
                  )
                }
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
              <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
                {detail.day}
              </Text>
              <Label muted>
                {detail.routine} · {new Date(detail.date).toLocaleDateString(locale)}
              </Label>
              <Label muted>
                {t("Tiempo", "Time")}: {time(detail)} · {t("Volumen", "Volume")}: {volume(detail)}
              </Label>
              {detail.exercises?.map((exercise, index) => (
                <View key={index} style={{ gap: 2, marginTop: space(2) }}>
                  <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
                    {translate(
                      locale,
                      findExercise(snapshot, exercise.id)?.name ?? exercise.id,
                      findExercise(snapshot, exercise.id)?.name ?? exercise.id,
                    )}
                  </Text>
                  {exercise.performedSets?.map((set, number) => {
                    const type = types.find((item) => item.id === (set.type ?? "normal"));
                    return (
                      <Text key={number} style={{ color: colors.muted, fontSize: 14 }}>
                        <Text style={{ color: typeColor[set.type ?? "normal"], fontWeight: "800" }}>
                          {type?.letter ?? "N"}
                        </Text>{" "}
                        {t("Serie", "Set")} {setNumber(exercise.performedSets ?? [], number)}: {set.kg ?? 0}{" "}
                        {detail.weightUnit ?? "kg"} ×{" "}
                        {set.seconds != null ? `${set.seconds} s` : `${set.reps ?? 0} reps`}
                      </Text>
                    );
                  })}
                  {exercise.note ? <Label>{exercise.note}</Label> : null}
                </View>
              ))}
              {detail.comment ? <Label>{detail.comment}</Label> : null}
              {detail.bodyWeightStartKg != null ? (
                <Label muted>
                  {t("Peso inicial:", "Starting weight:")}{" "}
                  {Math.round(detail.bodyWeightStartKg * factor * 10) / 10} {unit}
                </Label>
              ) : null}
              {detail.bodyWeightEndKg != null ? (
                <Label muted>
                  {t("Peso final:", "Final weight:")}{" "}
                  {Math.round(detail.bodyWeightEndKg * factor * 10) / 10} {unit}
                </Label>
              ) : null}
            </ScrollView>
          </>
        ) : null}
      </Overlay>
      <Overlay visible={poster !== null} onClose={() => setPoster(null)}>
        {poster ? (
          <>
            <Text
              style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}
            >
              {t("Compartir imagen", "Share image")}
            </Text>
            <View style={{ alignItems: "center" }}>
              <WorkoutPoster ref={posterRef} snapshot={snapshot} session={poster} width={230} />
            </View>
            <Button onPress={() => void share()}>{t("Compartir", "Share")}</Button>
            <Button variant="secondary" onPress={() => setPoster(null)}>
              {t("Volver", "Back")}
            </Button>
          </>
        ) : null}
      </Overlay>
      <ManualSession
        date={day ?? localDateKey(new Date())}
        visible={logging}
        onClose={() => {
          setLogging(false);
          onClose();
        }}
      />
    </>
  );
}
