import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { translate } from "@fitty/core/data/translations";
import { photosFit } from "@fitty/core/domain/exercise-photos";
import { muscleGroups } from "@fitty/core/domain/schemas/exercise";
import {
  customExerciseFormSchema,
  MAX_EXERCISE_PHOTOS,
} from "@fitty/core/domain/schemas/snapshot";
import { Dropdown } from "@/components/dropdown";
import { PhotoStrip } from "@/components/photo-strip";
import { Button, Field, Label, styles, Title } from "@/components/ui";
import { makeId } from "@/lib/id";
import { pickPhoto } from "@/lib/photos";
import { useAccount, useSnapshot } from "@/state/account";

const equipment = [
  "Barra",
  "Mancuernas",
  "Polea",
  "Máquina",
  "Peso corporal",
  "Otros",
] as const;

export function CustomExerciseForm({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const snapshot = useSnapshot();
  const { change, notify, t } = useAccount();
  const language = snapshot.settings.language ?? "es";
  const [name, setName] = useState("");
  const [group, setGroup] = useState<string>(muscleGroups[0]);
  const [gear, setGear] = useState<string>("Mancuernas");
  const [tracking, setTracking] = useState<"reps" | "seconds">("reps");
  const [steps, setSteps] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  // The app layout zeroes the top inset for its header; a modal needs the real one.
  const insets = initialWindowMetrics?.insets ?? { top: 54, bottom: 0 };
  const close = () => {
    setName("");
    setSteps("");
    setPhotos([]);
    onClose();
  };
  // Alerts are used here because the screen notice stays hidden behind this window.
  const full = () =>
    Alert.alert(
      t("No queda espacio para más fotos", "No room for more photos"),
      t(
        "Quitá alguna foto guardada para poder agregar otra.",
        "Remove a saved photo to add another one.",
      ),
    );
  const takePhoto = async (camera: boolean) => {
    try {
      // Reference photos are smaller than other photos: they stay in the account.
      return await pickPhoto(800, { camera, quality: 0.65 });
    } catch (error) {
      Alert.alert(
        camera && error instanceof Error && error.message === "camera-denied"
          ? t(
              "Permití el acceso a la cámara en los ajustes del teléfono.",
              "Allow camera access in your phone settings.",
            )
          : camera
            ? t(
                "No se pudo abrir la cámara.",
                "The camera could not be opened.",
              )
            : t("No se pudo cargar la foto.", "The photo could not be loaded."),
      );
      return null;
    }
  };
  const addPhoto = () =>
    new Promise<string | null>((resolve) => {
      const cancel = () => resolve(null);
      // The phone's own buttons: Android shows at most three.
      Alert.alert(
        t("Agregar foto", "Add photo"),
        undefined,
        [
          {
            text: t("Tomar foto", "Take photo"),
            onPress: () => void takePhoto(true).then(resolve),
          },
          {
            text: t("Elegir de la galería", "Choose from library"),
            onPress: () => void takePhoto(false).then(resolve),
          },
          { text: t("Cancelar", "Cancel"), style: "cancel", onPress: cancel },
        ],
        { cancelable: true, onDismiss: cancel },
      );
    });
  const save = () => {
    const parsed = customExerciseFormSchema.safeParse({
      id: `custom-${makeId()}`,
      name,
      group,
      equipment: gear,
      tracking,
      steps: steps.split("\n").filter((line) => line.trim()),
      ...(photos.length ? { photos } : {}),
    });
    if (!parsed.success)
      return Alert.alert(
        t(
          "Revisá el nombre y las instrucciones (máximo 10 líneas).",
          "Check the name and instructions (up to 10 lines).",
        ),
      );
    if (photos.length && !photosFit(snapshot, photos)) return full();
    if (
      change(
        (draft) =>
          void draft.customExercises.push({ ...parsed.data, custom: true }),
      )
    ) {
      notify(t("Ejercicio personalizado guardado", "Custom exercise saved"));
      close();
    }
  };
  const options = <T extends string>(items: readonly T[]) =>
    items.map((item) => ({
      value: item,
      label: translate(language, item, item),
    }));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Title>{t("Nuevo ejercicio", "New exercise")}</Title>
            <Field
              label={t("Nombre", "Name")}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
            <Dropdown
              label={t("Grupo muscular", "Muscle group")}
              options={options(muscleGroups)}
              value={group}
              onChange={setGroup}
            />
            <Dropdown
              label={t("Equipamiento", "Equipment")}
              options={options(equipment)}
              value={gear}
              onChange={setGear}
            />
            <Dropdown
              label={t("Registrar por", "Track by")}
              options={[
                {
                  value: "reps" as const,
                  label: t("Repeticiones", "Repetitions"),
                },
                { value: "seconds" as const, label: t("Tiempo", "Time") },
              ]}
              value={tracking}
              onChange={setTracking}
            />
            <Field
              label={t(
                "Instrucciones (una por línea)",
                "Instructions (one per line)",
              )}
              value={steps}
              onChangeText={setSteps}
              multiline
              maxLength={5000}
            />
            <Label muted>{t("Fotos (hasta 3)", "Photos (up to 3)")}</Label>
            <PhotoStrip
              photos={photos}
              max={MAX_EXERCISE_PHOTOS}
              pick={addPhoto}
              onChange={(next) => {
                if (next.length > photos.length && !photosFit(snapshot, next))
                  return full();
                setPhotos(next);
              }}
            />
            <Button disabled={!name.trim()} onPress={save}>
              {t("Guardar ejercicio", "Save exercise")}
            </Button>
            <Button variant="ghost" onPress={close}>
              {t("Cancelar", "Cancel")}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
