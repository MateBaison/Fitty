import { Card, Label, Screen } from "@/components/ui";
import { useAccount } from "@/state/account";

export default function Professionals() {
  const { t } = useAccount();
  return (
    <Screen>
      <Card>
        <Label>
          {t(
            "Próximamente, profesionales en Fitty",
            "Professionals are coming to Fitty",
          )}
        </Label>
        <Label muted>
          {t(
            "Todavía no hay profesionales publicados. Las postulaciones aún no están habilitadas.",
            "No professionals are listed yet. Applications are not open yet.",
          )}
        </Label>
      </Card>
    </Screen>
  );
}
