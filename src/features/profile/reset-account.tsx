"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/state/app-provider";
import { restartAccount } from "@/domain/account-reset";

// Temporary testing control; remove this component and its AccountPanel entry after testing.
export function ResetAccount() {
  const { t, snapshot, user, change, flush, status, holdRefresh } = useApp();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          setOpen(true);
          setError(false);
        }}
      >
        <RotateCcw aria-hidden="true" data-icon="inline-start" />
        {t("Reiniciar cuenta", "Reset account")}
      </Button>
      <AppDialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={t("Reiniciar cuenta", "Reset account")}
        description={t(
          "Herramienta temporal de pruebas. Vacía el perfil, rutinas e historial y vuelve a la configuración inicial. Conserva tu correo y acceso. Antes se guardará una copia local que podrás importar desde Perfil.",
          "Temporary testing tool. Clears your profile, routines and history and returns to initial setup. Keeps your email and sign-in. A local backup will be saved first; you can import it from Profile.",
        )}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || confirmation !== "REINICIAR") return;
            setBusy(true);
            setError(false);
            const release = holdRefresh();
            try {
              if (!applied) {
                if (!(await flush())) throw new Error("sync");
                const key = `mrgymson-user-${user.id}:reset-backup:${Date.now()}`;
                const raw = JSON.stringify(snapshot);
                localStorage.setItem(key, raw);
                if (localStorage.getItem(key) !== raw)
                  throw new Error("backup");
                if (!change(restartAccount)) throw new Error("reset");
                setApplied(true);
              }
              if (!(await flush())) throw new Error("sync");
              window.location.replace("/onboarding");
            } catch {
              setError(true);
              setBusy(false);
            } finally {
              release();
            }
          }}
        >
          <label htmlFor="reset-confirmation">
            {t("Escribí REINICIAR para confirmar", "Type REINICIAR to confirm")}
          </label>
          <Input
            id="reset-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={busy}
            autoComplete="off"
          />
          {error && (
            <p role="alert">
              {t(
                "No se pudo completar el reinicio. Revisá la sincronización y el almacenamiento del navegador y reintentá.",
                "Reset could not be completed. Check sync and browser storage, then retry.",
              )}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                busy ||
                confirmation !== "REINICIAR" ||
                (!applied && status !== "synced")
              }
            >
              {busy
                ? t("Reiniciando…", "Resetting…")
                : t("Confirmar reinicio", "Confirm reset")}
            </Button>
          </div>
        </form>
      </AppDialog>
    </>
  );
}
