import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import {
  workoutReadinessAdvice,
  type WorkoutReadiness,
} from "@fitty/core/domain/workout-readiness";
import { ChipGroup } from "@/components/chip";
import { Button, Card, Label, Title } from "@/components/ui";
import { useAccount } from "@/state/account";
import { space } from "@/theme";

/** Optional pre-workout check shown when the menstrual calendar is enabled. Answers are not saved. */
export function ReadinessCheck({
  visible,
  onClose,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const { t } = useAccount();
  const [value, setValue] = useState<WorkoutReadiness>({
    pain: "none",
    energy: "good",
    sleep: "good",
  });
  const [review, setReview] = useState(false);
  const advice = workoutReadinessAdvice(value);
  const close = () => {
    setReview(false);
    onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "#000a",
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={close}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View>
          <ScrollView
 showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(4) }}>
            <Card>
              <Title>
                {t("¿Cómo te sentís hoy?", "How do you feel today?")}
              </Title>
              {review ? (
                <>
                  <Label>
                    {advice === "usual"
                      ? t(
                          "Podés seguir tu sesión habitual",
                          "Continue your usual session",
                        )
                      : advice === "lighter"
                        ? t(
                            "Considerá una sesión más liviana",
                            "Consider a lighter session",
                          )
                        : t(
                            "Priorizá tu bienestar",
                            "Prioritize your wellbeing",
                          )}
                  </Label>
                  <Label muted>
                    {advice === "usual"
                      ? t(
                          "Si el calentamiento se siente bien, seguí tu entrenamiento previsto y ajustá según tus sensaciones.",
                          "If your warm-up feels good, follow your planned workout and adjust based on how you feel.",
                        )
                      : advice === "lighter"
                        ? t(
                            "Probá bajar la carga hasta que resulte cómoda, hacer menos series o descansar más entre ellas. Si las molestias aumentan, detené el ejercicio.",
                            "Try a comfortable lighter load, fewer sets or longer rests. Stop exercising if discomfort increases.",
                          )
                        : t(
                            "Con dolor intenso, no fuerces el entrenamiento. Descansá y consultá a un profesional de salud, especialmente si el dolor es nuevo, empeora o te impide tus actividades habituales.",
                            "With severe pain, do not push through training. Rest and seek medical advice, especially if pain is new, worsening or affects daily activities.",
                          )}
                  </Label>
                  <Label muted>
                    {t(
                      "La recomendación no modifica tu rutina ni tus pesos guardados. Estas respuestas no se guardan.",
                      "This suggestion does not change your routine or saved weights. Your answers are not saved.",
                    )}
                  </Label>
                  {advice !== "rest" ? (
                    <Button
                      onPress={() => {
                        setReview(false);
                        onStart();
                      }}
                    >
                      {t("Iniciar entrenamiento", "Start workout")}
                    </Button>
                  ) : null}
                  <Button variant="secondary" onPress={() => setReview(false)}>
                    {t("Cambiar respuestas", "Edit answers")}
                  </Button>
                  <Button variant="ghost" onPress={close}>
                    {t("Volver al inicio", "Back to home")}
                  </Button>
                </>
              ) : (
                <>
                  <Label muted>
                    {t("Dolor o molestias", "Pain or discomfort")}
                  </Label>
                  <ChipGroup
                    options={[
                      { value: "none", label: t("Sin molestias", "None") },
                      {
                        value: "mild",
                        label: t("Molestias leves", "Mild discomfort"),
                      },
                      {
                        value: "strong",
                        label: t("Dolor intenso", "Severe pain"),
                      },
                    ]}
                    value={value.pain}
                    onChange={(pain) => setValue({ ...value, pain })}
                  />
                  <Label muted>{t("Energía", "Energy")}</Label>
                  <ChipGroup
                    options={[
                      {
                        value: "good",
                        label: t("Me siento con energía", "I feel energetic"),
                      },
                      {
                        value: "low",
                        label: t("Estoy con poca energía", "Low energy"),
                      },
                    ]}
                    value={value.energy}
                    onChange={(energy) => setValue({ ...value, energy })}
                  />
                  <Label muted>{t("Sueño", "Sleep")}</Label>
                  <ChipGroup
                    options={[
                      { value: "good", label: t("Dormí bien", "Slept well") },
                      { value: "poor", label: t("Dormí mal", "Slept poorly") },
                    ]}
                    value={value.sleep}
                    onChange={(sleep) => setValue({ ...value, sleep })}
                  />
                  <Button onPress={() => setReview(true)}>
                    {t("Ver recomendación", "View suggestion")}
                  </Button>
                  <Button variant="secondary" onPress={onStart}>
                    {t("Omitir e iniciar", "Skip and start")}
                  </Button>
                </>
              )}
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
