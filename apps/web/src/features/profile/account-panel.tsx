"use client";
import { useApp } from "@/state/app-provider";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { ResetAccount } from "./reset-account";
export function AccountPanel() {
  const { status, message, retry, flush, t, snapshot } = useApp();
  return (
    <>
      {status !== "synced" && (
        <section className="panel">
          <h2 className="mb-3 text-xl font-bold">
            {t("Sincronización", "Sync")}
          </h2>
          <p className="my-3 text-muted-foreground">{message}</p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              void retry();
            }}
          >
            {t("Reintentar sincronización", "Retry sync")}
          </Button>
        </section>
      )}
      <ResetAccount />
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`/privacidad?lang=${snapshot.settings.language ?? "es"}`}
          target="_blank"
          rel="noopener noreferrer"
          data-slot="button"
          className={buttonVariants({ variant: "secondary" }) + " w-full"}
        >
          {t("Política de privacidad", "Privacy policy")}
        </a>
        <SignOutButton flush={flush} language={snapshot.settings.language} />
      </div>
    </>
  );
}
