import { requireOptionalNativeModule } from "expo";
import { useEffect, useState } from "react";
import { Modal, Pressable, Share, View } from "react-native";
import { Button, Card, Field, Label, Title } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

// An app installed before the clipboard library was added (an older development
// build) lacks its native part, and importing it there crashes on opening.
const clipboard = requireOptionalNativeModule("ExpoClipboard")
  ? (require("expo-clipboard") as typeof import("expo-clipboard"))
  : null;

/**
 * The link of a shared routine: copy it straight to the clipboard, or open the
 * phone's share menu. Hidden while there is no link.
 */
export function ShareRoutine({
  link,
  onClose,
}: {
  link: string | null;
  onClose: () => void;
}) {
  const { t } = useAccount();
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [link]);
  return (
    <Modal
      visible={link !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: space(4),
          backgroundColor: "#000a",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Cerrar", "Close")}
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View>
          <Card style={{ borderColor: colors.border }}>
            <Title>{t("Compartir rutina", "Share routine")}</Title>
            <Label muted>
              {t(
                "Se comparte una copia editable; no tu perfil, historial, pesos ni notas privadas.",
                "An editable copy is shared; not your profile, history, weights or private notes.",
              )}
            </Label>
            <Field
              label={t("Enlace de rutina", "Routine link")}
              value={link ?? ""}
              editable={false}
              locked
            />
            {clipboard ? (
              <Button
                variant={copied ? "success" : "primary"}
                onPress={() => {
                  if (link)
                    void clipboard
                      .setStringAsync(link)
                      .then(() => setCopied(true));
                }}
              >
                {copied
                  ? t("Enlace copiado", "Link copied")
                  : t("Copiar enlace", "Copy link")}
              </Button>
            ) : null}
            <Button
              variant={clipboard ? "secondary" : "primary"}
              onPress={() => {
                if (link) void Share.share({ message: link });
              }}
            >
              {t("Compartir…", "Share…")}
            </Button>
            <Button variant="ghost" onPress={onClose}>
              {t("Cerrar", "Close")}
            </Button>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
