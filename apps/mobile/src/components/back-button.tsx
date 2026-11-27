import { Pressable } from "react-native";
import { Chevron } from "@/lib/direction";
import { useAccount } from "@/state/account";
import { colors } from "@/theme";

/** Square back button shared by screens that sit left of a search field. */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useAccount();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("Volver", "Back")}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.secondary,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <Chevron to="back" style={{ color: colors.accent, fontSize: 22, fontWeight: "700" }} />
    </Pressable>
  );
}
