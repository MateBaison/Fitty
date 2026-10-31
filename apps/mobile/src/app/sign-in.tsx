import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  View,
} from "react-native";
import { translate } from "@fitty/core/data/translations";
import { z } from "zod";
import { LanguageMenu } from "@/components/language-menu";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { storedLanguage, storeLanguage } from "@/lib/language";
import { signInWithApple, signInWithProvider } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

const emailSchema = z.email().max(254);
const codeSchema = z.string().regex(/^\d{6,8}$/);

export default function SignIn() {
  const [language, setLanguage] = useState(storedLanguage);
  const t = (spanish: string, english: string) =>
    translate(language, spanish, english);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: async (value: string) => {
      const parsed = emailSchema.safeParse(value.trim().toLowerCase());
      if (!parsed.success)
        throw new Error(t("Ingresá un correo válido.", "Enter a valid email."));
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { shouldCreateUser: true },
      });
      if (error)
        throw new Error(
          t(
            "No pudimos enviar el código. Probá de nuevo.",
            "We couldn't send the code. Try again.",
          ),
        );
      return parsed.data;
    },
    onSuccess: setSentTo,
  });
  const verify = useMutation({
    mutationFn: async (token: string) => {
      if (!sentTo || !codeSchema.safeParse(token).success)
        throw new Error(
          t(
            "Ingresá el código de 6 a 8 dígitos.",
            "Enter the 6 to 8 digit code.",
          ),
        );
      const { error } = await supabase.auth.verifyOtp({
        email: sentTo,
        token,
        type: "email",
      });
      if (error)
        throw new Error(
          t(
            "El código no es válido o venció.",
            "The code is invalid or has expired.",
          ),
        );
    },
  });
  const oauth = useMutation({ mutationFn: signInWithProvider });
  const appleSignIn = useMutation({ mutationFn: signInWithApple });
  const error = (
    oauth.error ??
    appleSignIn.error ??
    (sentTo ? verify.error : send.error)
  )?.message;
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen glow>
          <Image
            source={require("@/assets/images/fitty-isotype.png")}
            style={{
              width: 72,
              height: 72,
              alignSelf: "center",
            }}
            accessibilityIgnoresInvertColors
          />
          <Image
            source={require("@/assets/images/fitty-wordmark.png")}
            style={{ width: 110, height: 53, alignSelf: "center" }}
            resizeMode="contain"
            accessibilityLabel="Fitty"
            accessibilityIgnoresInvertColors
          />
          <Title>{t("Iniciar sesión", "Sign in")}</Title>
          <Label muted>
            {t(
              "Tu entrenamiento, tus rutinas y tu progreso.",
              "Your training, your routines and your progress.",
            )}
          </Label>
          <Card>
            {sentTo ? (
              <>
                <Label>
                  {t("Te enviamos un código a", "We sent a code to")} {sentTo}.
                </Label>
                <Field
                  label={t("Código", "Code")}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={8}
                />
                <Button
                  onPress={() => verify.mutate(code)}
                  loading={verify.isPending}
                >
                  {t("Entrar", "Enter")}
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => {
                    setSentTo(null);
                    setCode("");
                    verify.reset();
                  }}
                >
                  {t("Usar otro correo", "Use another email")}
                </Button>
              </>
            ) : (
              <>
                <Field
                  label={t("Correo electrónico", "Email")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Button
                  onPress={() => send.mutate(email)}
                  loading={send.isPending}
                >
                  {t("Enviar código", "Send code")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={oauth.isPending || appleSignIn.isPending}
                  onPress={() => oauth.mutate("google")}
                >
                  {t("Continuar con Google", "Continue with Google")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={oauth.isPending || appleSignIn.isPending}
                  onPress={() => appleSignIn.mutate()}
                >
                  {t("Continuar con Apple", "Continue with Apple")}
                </Button>
              </>
            )}
            {error ? (
              <Label style={{ color: colors.destructive }}>{error}</Label>
            ) : null}
          </Card>
          <Button
            variant="ghost"
            onPress={() =>
              void Linking.openURL(
                `https://fitty.uy/privacidad?lang=${language}`,
              )
            }
          >
            {t("Política de privacidad", "Privacy policy")}
          </Button>
        </Screen>
      </KeyboardAvoidingView>
      <LanguageMenu
        value={language}
        label={t("Idioma", "Language")}
        onChange={(code) => {
          setLanguage(code);
          storeLanguage(code);
        }}
      />
    </View>
  );
}
