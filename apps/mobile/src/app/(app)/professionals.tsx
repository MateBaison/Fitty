import { Button, Card, Label, Screen } from "@/components/ui";
import { openWebPage } from "@/lib/open-link";
import { useAccount } from "@/state/account";

export default function Professionals() {
  const { t } = useAccount();
  return (
    <Screen>
      <Card>
        <Label>
          {t(
            "Encontrá entrenadores y profesionales cerca tuyo.",
            "Find trainers and professionals near you.",
          )}
        </Label>
        <Label muted>
          {t(
            "Por ahora el directorio está disponible en fitty.uy.",
            "For now the directory is available at fitty.uy.",
          )}
        </Label>
        <Button
          onPress={() => void openWebPage("https://fitty.uy/professionals")}
        >
          {t("Abrir en fitty.uy", "Open on fitty.uy")}
        </Button>
      </Card>
    </Screen>
  );
}
