import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { translate } from "@fitty/core/data/translations";
import { muscleGroups } from "@fitty/core/domain/schemas/exercise";
import { customExerciseFormSchema } from "@fitty/core/domain/schemas/snapshot";
import { ChipGroup } from "@/components/chip";
import { Button, Field, Label, styles, Title } from "@/components/ui";
import { makeId } from "@/lib/id";
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
  const close = () => {
    setName("");
    setSteps("");
    onClose();
  };
  const save = () => {
    const parsed = customExerciseFormSchema.safeParse({
      id: `custom-${makeId()}`,
      name,
      group,
      equipment: gear,
      tracking,
      steps: steps.split("\n").filter((line) => line.trim()),
    });
    if (!parsed.success)
      return notify(
        t(
          "Revisá el nombre y las instrucciones (máximo 10 líneas).",
          "Check the name and instructions (up to 10 lines).",
        ),
      );
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
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
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
            <Label muted>{t("Grupo muscular", "Muscle group")}</Label>
            <ChipGroup
              options={muscleGroups.map((item) => ({
                value: item as string,
                label: translate(language, item, item),
              }))}
              value={group}
              onChange={setGroup}
            />
            <Label muted>{t("Equipamiento", "Equipment")}</Label>
            <ChipGroup
              options={equipment.map((item) => ({
                value: item as string,
                label: translate(language, item, item),
              }))}
              value={gear}
              onChange={setGear}
            />
            <Label muted>{t("Registrar por", "Track by")}</Label>
            <ChipGroup
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
            <Button disabled={!name.trim()} onPress={save}>
              {t("Guardar ejercicio", "Save exercise")}
            </Button>
            <Button variant="ghost" onPress={close}>
              {t("Cancelar", "Cancel")}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
