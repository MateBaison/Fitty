import { Text, View } from "react-native";
import { useAccount } from "@/state/account";
import { colors, radius, space } from "@/theme";

export function Notice() {
  const { notice } = useAccount();
  if (!notice) return null;
  return (
    <View
      accessibilityLiveRegion="assertive"
      style={{
        backgroundColor: colors.secondary,
        borderRadius: radius,
        padding: space(3),
      }}
    >
      <Text style={{ color: colors.foreground }}>{notice}</Text>
    </View>
  );
}
