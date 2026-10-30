import { Text } from "react-native";
import { useAccount } from "@/state/account";
import { colors } from "@/theme";

/** Distinguishes changes saved on the phone from changes confirmed in the cloud. */
export function SyncStatus() {
  const { view, t } = useAccount();
  const [label, color] =
    view.status === "synced"
      ? [t("Guardado en la nube", "Saved to the cloud"), colors.success]
      : view.status === "saving"
        ? [t("Guardando en la nube…", "Saving to the cloud…"), colors.accent]
        : view.status === "dirty" || view.status === "offline"
          ? [
              t("Guardado en este teléfono", "Saved on this phone"),
              colors.warning,
            ]
          : view.status === "error"
            ? [view.message, colors.destructive]
            : [view.message, colors.muted];
  return (
    <Text
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={{ color, fontSize: 13 }}
    >
      ● {label}
    </Text>
  );
}
