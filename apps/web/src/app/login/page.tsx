import { AppHeader } from "@/components/layout/app-header";
import { LoginForm } from "@/features/auth/login-form";
import { configured } from "@/lib/env";
import { verifiedUser } from "@/lib/supabase/account-reader";
import { redirect } from "next/navigation";
import { PrivacyLink } from "@/features/auth/privacy-link";
import { PublicLanguagePicker } from "@/features/auth/public-language-picker";
import { PublicLanguageHeading } from "@/features/auth/public-language-heading";
export default async function LoginPage() {
  if (configured() && (await verifiedUser())) redirect("/home");
  return (
    <div className="app-shell">
      <AppHeader accountAction={<PublicLanguagePicker />} />
      <img
        src="/assets/brand/fitty-isotype.png"
        alt="Fitty"
        width={72}
        height={72}
        className="login-isotype"
      />
      <main className="hero-panel login-panel">
        <PublicLanguageHeading />
        {configured() ? (
          <LoginForm />
        ) : (
          <p>
            Configurá las variables de Supabase de .env.example para habilitar
            el acceso. No se ha conectado ninguna cuenta.
          </p>
        )}
      </main>
      <p className="login-legal">
        <PrivacyLink />
      </p>
    </div>
  );
}
