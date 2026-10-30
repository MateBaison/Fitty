"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  appleLogin,
  googleLogin,
  requestCode,
  verifyCode,
} from "@/lib/supabase/auth-actions";
import { PENDING_EMAIL_KEY } from "@fitty/core/storage/account-cache";
import { translate, localeFor } from "@fitty/core/data/translations";
import { z } from "zod";
export function LoginForm() {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [language, setLanguage] = useState("es");
  const t = (es: string, en: string) => translate(language, es, en);
  const router = useRouter();
  useEffect(() => {
    const savedLanguage = localeFor(localStorage.getItem("fitty-language") ?? "es");
    setLanguage(savedLanguage);
    const onLanguageChange = (event: Event) =>
      setLanguage(localeFor((event as CustomEvent<string>).detail));
    window.addEventListener("fitty-language-change", onLanguageChange);
    try {
      const saved = z
        .email()
        .safeParse(sessionStorage.getItem(PENDING_EMAIL_KEY));
      if (saved.success) {
        setEmail(saved.data);
        setSent(true);
      }
    } catch {
      /* Storage can be blocked; login remains usable. */
    }
    return () => window.removeEventListener("fitty-language-change", onLanguageChange);
  }, []);
  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = sent
              ? await verifyCode(email, code)
              : await requestCode(email);
            if (result.error) setError(result.error);
            else if (sent) {
              try {
                sessionStorage.removeItem(PENDING_EMAIL_KEY);
              } catch {}
              router.replace("/home");
              router.refresh();
            } else {
              try {
                sessionStorage.setItem(PENDING_EMAIL_KEY, email);
              } catch {}
              setSent(true);
            }
          } catch {
            setError(
              t("No pudimos conectar. Revisá la configuración o tu conexión.", "Could not connect. Check your settings or connection."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          {t("Correo electrónico", "Email address")}
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={sent}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {sent && (
          <label className="block">
            {t("Código del correo", "Email code")}
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              required
              minLength={6}
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t("Conectando…", "Connecting…") : sent ? t("Verificar código", "Verify code") : t("Enviar código", "Send code")}
        </Button>
      </form>
      {sent && (
        <Button
          variant="secondary"
          className="w-full"
          disabled={busy}
          onClick={() => {
            try {
              sessionStorage.removeItem(PENDING_EMAIL_KEY);
            } catch {}
            setError("");
            setSent(false);
            setCode("");
          }}
        >
          {t("Cambiar correo o pedir otro código", "Change email or request another code")}
        </Button>
      )}
      <form action={googleLogin}>
        <Button variant="secondary" className="w-full" type="submit">
          {t("Continuar con Google", "Continue with Google")}
        </Button>
      </form>
      <form action={appleLogin}>
        <Button variant="secondary" className="w-full" type="submit">
          {t("Continuar con Apple", "Continue with Apple")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("Tu cuenta guarda rutinas y entrenamientos en la nube. Nunca compartas el código recibido.", "Your account saves routines and workouts in the cloud. Never share your verification code.")}
      </p>
    </div>
  );
}
