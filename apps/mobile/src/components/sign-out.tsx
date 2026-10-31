import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Button, Card, Label } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Asks before signing out and, like the web, warns when changes are not confirmed in the cloud. */
export function SignOut() {
  const { flush, t } = useAccount();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (busy) return;
    setOpen(false);
    setPending(false);
  };
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!pending) {
        let saved = false;
        try {
          saved = await flush();
        } catch {
          /* Require explicit consent before leaving unsynced data. */
        }
        if (!saved) {
          setPending(true);
          return;
        }
      }
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="secondary" onPress={() => setOpen(true)}>
        {t("Cerrar sesión", "Sign out")}
      </Button>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel={t("Cancelar", "Cancel")}
          onPress={close}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: space(4),
            backgroundColor: "#000a",
          }}
        >
          <Pressable onPress={() => undefined}>
            <Card style={{ borderColor: colors.border }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {t("¿Cerrar sesión?", "Sign out?")}
              </Text>
              <View style={{ alignItems: "center" }}>
                <Label muted>
                  {pending
                    ? t(
                        "No pudimos confirmar que todos tus datos estén en la nube. Los cambios guardados localmente seguirán en este dispositivo. ¿Querés salir igualmente?",
                        "We could not confirm all your data is in the cloud. Locally saved changes will remain on this device. Leave anyway?",
                      )
                    : t(
                        "Intentaremos sincronizar tus cambios antes de salir de esta cuenta.",
                        "We will try to sync your changes before leaving this account.",
                      )}
                </Label>
              </View>
              <Button variant="secondary" disabled={busy} onPress={close}>
                {t("Cancelar", "Cancel")}
              </Button>
              <Button loading={busy} onPress={() => void confirm()}>
                {pending
                  ? t("Salir igualmente", "Leave anyway")
                  : t("Cerrar sesión", "Sign out")}
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
