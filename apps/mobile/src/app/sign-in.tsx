import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform } from "react-native";
import { z } from "zod";
import { Button, Card, Field, Label, Screen, Title } from "@/components/ui";
import { signInWithProvider } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

const emailSchema = z.email().max(254);
const codeSchema = z.string().regex(/^\d{6,8}$/);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: async (value: string) => {
      const parsed = emailSchema.safeParse(value.trim().toLowerCase());
      if (!parsed.success) throw new Error("Ingresá un correo válido.");
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { shouldCreateUser: true },
      });
      if (error)
        throw new Error("No pudimos enviar el código. Probá de nuevo.");
      return parsed.data;
    },
    onSuccess: setSentTo,
  });
  const verify = useMutation({
    mutationFn: async (token: string) => {
      if (!sentTo || !codeSchema.safeParse(token).success)
        throw new Error("Ingresá el código de 6 a 8 dígitos.");
      const { error } = await supabase.auth.verifyOtp({
        email: sentTo,
        token,
        type: "email",
      });
      if (error) throw new Error("El código no es válido o venció.");
    },
  });
  const oauth = useMutation({ mutationFn: signInWithProvider });
  const error = (oauth.error ?? (sentTo ? verify.error : send.error))?.message;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            alignSelf: "center",
          }}
          accessibilityIgnoresInvertColors
        />
        <Title>Fitty</Title>
        <Label muted>Tu entrenamiento, tus rutinas y tu progreso.</Label>
        <Card>
          {sentTo ? (
            <>
              <Label>Te enviamos un código a {sentTo}.</Label>
              <Field
                label="Código"
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
                Entrar
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  setSentTo(null);
                  setCode("");
                  verify.reset();
                }}
              >
                Usar otro correo
              </Button>
            </>
          ) : (
            <>
              <Field
                label="Correo electrónico"
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
                Enviar código
              </Button>
              <Button
                variant="secondary"
                disabled={oauth.isPending}
                onPress={() => oauth.mutate("google")}
              >
                Continuar con Google
              </Button>
              <Button
                variant="secondary"
                disabled={oauth.isPending}
                onPress={() => oauth.mutate("apple")}
              >
                Continuar con Apple
              </Button>
            </>
          )}
          {error ? (
            <Label style={{ color: colors.destructive }}>{error}</Label>
          ) : null}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
