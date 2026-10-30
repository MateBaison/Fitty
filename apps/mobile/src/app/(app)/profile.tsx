import { View } from "react-native";
import { languages } from "@fitty/core/data/translations";
import { Chip } from "@/components/chip";
import { SyncStatus } from "@/components/sync-status";
import { Button, Card, Label, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAccount, useSnapshot } from "@/state/account";
import { useSession } from "@/state/session";
import { space } from "@/theme";

const languageNames: Record<string, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export default function Profile() {
  const snapshot = useSnapshot();
  const { change, flush, t } = useAccount();
  const { session } = useSession();
  const language = snapshot.settings.language ?? "es";
  const unit = snapshot.settings.weight ?? "kg";
  return (
    <Screen>
      <Title>{snapshot.profile.name?.trim() || t("Perfil", "Profile")}</Title>
      <Card>
        <Label muted>{session?.user.email}</Label>
        <SyncStatus />
      </Card>
      <Card>
        <Label muted>{t("Idioma", "Language")}</Label>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}
        >
          {languages.map((code) => (
            <Chip
              role="radio"
              key={code}
              label={languageNames[code] ?? code}
              active={language === code}
              onPress={() =>
                change((draft) => void (draft.settings.language = code))
              }
            />
          ))}
        </View>
      </Card>
      <Card>
        <Label muted>{t("Unidad de peso", "Weight unit")}</Label>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: "row", gap: space(2) }}
        >
          {(["kg", "lb"] as const).map((value) => (
            <Chip
              role="radio"
              key={value}
              label={value}
              active={unit === value}
              onPress={() =>
                change((draft) => void (draft.settings.weight = value))
              }
            />
          ))}
        </View>
      </Card>
      <Button
        variant="secondary"
        onPress={async () => {
          await flush();
          await supabase.auth.signOut();
        }}
      >
        {t("Cerrar sesión", "Sign out")}
      </Button>
    </Screen>
  );
}
