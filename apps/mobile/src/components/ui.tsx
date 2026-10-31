import { createContext, useState, type ReactNode } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors, radius, space } from "@/theme";

/** Blue light fading from the top-right corner, like the web body background. */
export function Glow() {
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

/** Lets a child (like a drag-to-reorder list) pause the screen's scrolling while it handles a gesture. */
export const ScrollLockContext = createContext<(locked: boolean) => void>(
  () => undefined,
);

export function Screen({
  children,
  scroll = true,
  glow = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  glow?: boolean;
}) {
  // Read from the context so screens under the app header (which owns the top inset) get no extra gap.
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(false);
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {glow ? <Glow /> : null}
      {scroll ? (
        <ScrollView
 showsVerticalScrollIndicator={false}
          style={glow ? { backgroundColor: "transparent" } : undefined}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!locked}
        >
          <ScrollLockContext.Provider value={setLocked}>
            {children}
          </ScrollLockContext.Provider>
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </View>
  );
}

export function Title({
  children,
  center,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={[styles.title, center && { textAlign: "center" }]}
    >
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
  fit,
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive" | "success" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  /** Shrinks the label to stay on one line. */
  fit?: boolean;
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
          numberOfLines={fit ? 1 : undefined}
          adjustsFontSizeToFit={fit}
          minimumFontScale={0.7}
          style={[
            styles.buttonText,
            variant === "primary" && { color: colors.primaryForeground },
            (variant === "destructive" || variant === "success") && {
              color: "#ffffff",
            },
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
    borderWidth: 1,
    borderRadius: 24,
    padding: space(4.5),
    gap: space(3),
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: space(5),
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderWidth: 1,
  },
  destructive: { backgroundColor: colors.destructive },
  success: { backgroundColor: "#16a34a" },
  ghost: { backgroundColor: "transparent" },
  buttonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
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
