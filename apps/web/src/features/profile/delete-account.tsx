"use client";
import { useState, type ReactNode } from "react";
import { Trash2, ShieldCheck } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/lib/supabase/auth-actions";
import { browserClient } from "@/lib/supabase/browser";
import { accountCacheKey } from "@fitty/core/storage/account-cache";

export function DeleteAccount({ saveAction }: { saveAction: ReactNode }) {
  const { user, t, disposeDeletedAccount } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section className="flex flex-col gap-4">
      <div className="settings-actions">
        <Button
          type="button"
          variant="destructive-solid"
          size="sm"
          onClick={() => setUnlocked(true)}
          disabled={busy}
        >
          <Trash2 aria-hidden="true" data-icon="inline-start" />
          {t("Eliminar cuenta", "Delete account")}
        </Button>
        {saveAction}
      </div>
      {unlocked && (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              busy ||
              !acknowledged ||
              confirmation !== "ELIMINAR" ||
              email !== user.email
            )
              return;
            setBusy(true);
            setError(false);
            try {
              const result = await deleteAccount({
                confirmation,
                email,
                acknowledged,
              });
              if (!result.deleted) {
                setError(true);
                setBusy(false);
                return;
              }
              disposeDeletedAccount();
              try {
                const key = accountCacheKey(user.id);
                const keys = Object.keys(localStorage).filter(
                  (value) => value === key || value.startsWith(`${key}:`),
                );
                keys.forEach((value) => localStorage.removeItem(value));
              } catch {
                /* Restricted browser storage must not prevent logout. */
              }
              await browserClient()
                .auth.signOut({ scope: "local" })
                .catch(() => undefined);
              window.location.replace("/login");
            } catch {
              setError(true);
              setBusy(false);
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            {t(
              "Se eliminarán permanentemente tu cuenta, rutinas, entrenamientos, fotos y recorridos. Exportá una copia antes si querés conservarlos. Esta acción no se puede revertir.",
              "Your account, routines, workouts, photos and routes will be permanently deleted. Export a backup first if you want to keep them. This cannot be reversed.",
            )}
          </p>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={busy}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            {t(
              "Entiendo que perderé todos mis datos",
              "I understand that all my data will be lost",
            )}
          </label>
          <label className="block">
            {t("Escribí tu email para confirmar", "Type your email to confirm")}
            <Input
              type="email"
              autoComplete="off"
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            {t(
              "Escribí ELIMINAR para desbloquear el botón",
              "Type ELIMINAR to unlock the button",
            )}
            <Input
              autoComplete="off"
              value={confirmation}
              disabled={busy}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert">
              {t(
                "No se pudo eliminar la cuenta. No se confirmó ningún borrado. Reintentá más tarde.",
                "The account could not be deleted. No deletion was confirmed. Try again later.",
              )}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 whitespace-normal"
              disabled={busy}
              onClick={() => {
                setUnlocked(false);
                setAcknowledged(false);
                setEmail("");
                setConfirmation("");
                setError(false);
              }}
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive-solid"
              className="min-w-0 flex-1 whitespace-normal"
              disabled={
                busy ||
                !acknowledged ||
                email !== user.email ||
                confirmation !== "ELIMINAR"
              }
            >
              <ShieldCheck aria-hidden="true" />
              {busy
                ? t("Eliminando…", "Deleting…")
                : t("Eliminar definitivamente", "Permanently delete")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
