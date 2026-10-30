import { AppHeader } from "@/components/layout/app-header";
import { LoginForm } from "@/features/auth/login-form";
import { configured } from "@/lib/env";
import { verifiedUser } from "@/lib/supabase/account-reader";
import { redirect } from "next/navigation";
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
      </main>
    </div>
  );
}
