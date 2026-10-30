import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors, radius, space } from "@/theme";

/** Blue light fading from the top-right corner, like the web body background. */
function Glow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="90%" cy="-5%" r="95%">
          <Stop offset="0" stopColor="#1d6a99" stopOpacity="1" />
          <Stop offset="0.45" stopColor="#153f5a" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#153f5a" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

export function Screen({
  children,
  scroll = true,
  glow = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  glow?: boolean;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {glow ? <Glow /> : null}
      {scroll ? (
        <ScrollView
          style={glow ? { backgroundColor: "transparent" } : undefined}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

export function Label({
  children,
  muted,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: object;
}) {
  return (
    <Text style={[styles.label, muted && styles.muted, style]}>{children}</Text>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled,
  loading,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "primary" && { color: colors.primaryForeground },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space(1.5) }}>
      <Label muted>{label}</Label>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Loading({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? <Label muted>{message}</Label> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space(4), gap: space(4), paddingBottom: space(12) },
  title: { color: colors.foreground, fontSize: 28, fontWeight: "800" },
  label: { color: colors.foreground, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius,
    padding: space(4),
    gap: space(3),
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: space(5),
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  destructive: { backgroundColor: colors.destructive },
  ghost: { backgroundColor: "transparent" },
  buttonText: { color: colors.foreground, fontSize: 16, fontWeight: "700" },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    color: colors.foreground,
    paddingHorizontal: space(3.5),
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space(3),
    backgroundColor: colors.background,
  },
});
