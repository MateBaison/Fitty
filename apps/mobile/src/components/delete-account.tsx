import { useState } from "react";
import { View } from "react-native";
import { Switch } from "@/components/switch";
import { accountCacheKey } from "@fitty/core/storage/account-cache";
import {
  deleteConfirmationLabel,
  isDeleteConfirmation,
} from "@fitty/core/data/translations";
import { Button, Card, Field, Label } from "@/components/ui";
import { appleDeletionCode } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/state/account";
import { useSession } from "@/state/session";
import { space } from "@/theme";

/** Same safeguards as the web: acknowledgement, account email and the phrase ELIMINAR. */
export function DeleteAccount() {
  const { t, view } = useAccount();
  const language = view.snapshot?.settings.language ?? "es";
  const { session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [appleCancelled, setAppleCancelled] = useState(false);
  if (!user?.email) return null;
  const ready =
    acknowledged &&
    isDeleteConfirmation(language, confirmation) &&
    email.trim().toLowerCase() === user.email.toLowerCase();
  const close = () => {
    setOpen(false);
    setAcknowledged(false);
    setEmail("");
    setConfirmation("");
    setFailed(false);
    setAppleCancelled(false);
  };
  const remove = async () => {
    if (busy || !ready || !user.email) return;
    setBusy(true);
    setFailed(false);
    setAppleCancelled(false);
    const usesApple = user.identities?.some((item) => item.provider === "apple");
    const apple = usesApple
      ? await appleDeletionCode().catch(() => null)
      : null;
    if (apple?.cancelled) {
      setAppleCancelled(true);
      setBusy(false);
      return;
    }
    // The Edge Function verifies the bearer token itself and derives the account.
    const result = await supabase.functions
      .invoke("delete-account", {
        body: {
          confirmation: "ELIMINAR",
          email: user.email,
          acknowledged,
          appleAuthorizationCode: apple?.code ?? undefined,
        },
      })
      .catch(() => null);
    if (!result || result.error || result.data?.deleted !== true) {
      setFailed(true);
      setBusy(false);
      return;
    }
    try {
      const key = accountCacheKey(user.id);
      for (const name of Object.keys(localStorage))
        if (name === key || name.startsWith(`${key}:`))
          localStorage.removeItem(name);
    } catch {
      /* Unavailable storage must not prevent sign-out. */
    }
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  };
  if (!open)
    return (
      <Button variant="destructive" onPress={() => setOpen(true)}>
        {t("Eliminar cuenta", "Delete account")}
      </Button>
    );
  return (
    <Card>
      <Label muted>
        {t(
          "Se eliminarán permanentemente tu cuenta, rutinas, entrenamientos, fotos y recorridos. Exportá una copia antes si querés conservarlos. Esta acción no se puede revertir.",
          "Your account, routines, workouts, photos and routes will be permanently deleted. Export a backup first if you want to keep them. This cannot be reversed.",
        )}
      </Label>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}
      >
        <Switch
          value={acknowledged}
          disabled={busy}
          onValueChange={setAcknowledged}
        />
        <View style={{ flex: 1 }}>
          <Label>
            {t(
              "Entiendo que perderé todos mis datos",
              "I understand that all my data will be lost",
            )}
          </Label>
        </View>
      </View>
      <Field
        label={t(
          "Escribí tu email para confirmar",
          "Type your email to confirm",
        )}
        value={email}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <Field
        label={deleteConfirmationLabel(language)}
        value={confirmation}
        editable={!busy}
        autoCapitalize="characters"
        autoCorrect={false}
        onChangeText={setConfirmation}
      />
      {failed ? (
        <Label>
          {t(
            "No se pudo eliminar la cuenta. No se confirmó ningún borrado. Reintentá más tarde.",
            "The account could not be deleted. No deletion was confirmed. Try again later.",
          )}
        </Label>
      ) : null}
      {appleCancelled ? (
        <Label>
          {t(
            "No se confirmó con Apple, así que tu cuenta no se eliminó.",
            "Apple confirmation was cancelled, so your account was not deleted.",
          )}
        </Label>
      ) : null}
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" disabled={busy} onPress={close}>
            {t("Cancelar", "Cancel")}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="destructive"
            disabled={!ready}
            loading={busy}
            onPress={() => void remove()}
          >
            {t("Eliminar definitivamente", "Permanently delete")}
          </Button>
        </View>
      </View>
    </Card>
  );
}
