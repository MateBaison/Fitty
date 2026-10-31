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
      <main className="hero-panel login-panel mt-8">
        <PublicLanguageHeading />
        {configured() ? (
          <LoginForm />
        ) : (
          <p>
            Configurá las variables de Supabase de .env.example para habilitar
            el acceso. No se ha conectado ninguna cuenta.
          </p>
        )}
        <p className="mt-6 text-sm">
          <PrivacyLink />
        </p>
      </main>
    </div>
  );
}
