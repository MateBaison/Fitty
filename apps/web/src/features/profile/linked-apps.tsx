"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { linkProvider, unlinkProvider } from "@/lib/supabase/auth-actions";
import { browserClient } from "@/lib/supabase/browser";
import { useApp } from "@/state/app-provider";

const providers = [
  ["google", "Google"],
  ["apple", "Apple"],
] as const;

/** Sign-in methods linked to this account; any linked method opens the same data. */
export function LinkedApps() {
  const { t, notify } = useApp();
  const [linked, setLinked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const { data } = await browserClient().auth.getUserIdentities();
    setLinked(data?.identities.map((identity) => identity.provider) ?? []);
  }, []);
  useEffect(() => {
    void load();
    const params = new URLSearchParams(location.search);
    if (params.get("linkError") === "exists") {
      const failure = t(
        "No pudimos vincular esta cuenta. Puede que ya esté vinculada a otro usuario de Fitty.",
        "We could not link this account. It may already belong to another Fitty user.",
      );
      setMessage(failure);
      notify(failure);
      history.replaceState(null, "", location.pathname);
    }
  }, [load, notify, t]);
  const count = linked?.length ?? 0;
  const run = async (action: () => Promise<{ error?: string }>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      if (result.error === "last")
        setMessage(
          t(
            "No podés desvincular tu único método de inicio de sesión.",
            "You cannot unlink your only sign-in method.",
          ),
        );
      else if (result.error)
        setMessage(
          t(
            "No pudimos completar la acción. Reintentá más tarde.",
            "We could not complete the action. Try again later.",
          ),
        );
      else {
        await load();
        notify("Cambios guardados");
      }
    } catch {
      // A successful link redirects the browser to the provider.
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t(
          "Vinculá tus cuentas para iniciar sesión como prefieras. Tus datos son los mismos sin importar el método.",
          "Link your accounts to sign in however you like. Your data stays the same whichever method you use.",
        )}
      </p>
      <ul className="space-y-2">
        <li className="flex items-center justify-between gap-3">
          <span>{t("Correo", "Email")}</span>
          <span className="text-sm text-muted-foreground">
            {linked?.includes("email") ? t("Vinculada", "Linked") : "—"}
          </span>
        </li>
        {providers.map(([id, name]) => {
          const isLinked = linked?.includes(id) === true;
          return (
            <li key={id} className="flex items-center justify-between gap-3">
              <span>{name}</span>
              {linked === null ? null : isLinked ? (
                <span className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t("Vinculada", "Linked")}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || count < 2}
                    onClick={() => run(() => unlinkProvider(id))}
                  >
                    {t("Desvincular", "Unlink")}
                  </Button>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => linkProvider(id))}
                >
                  {t("Vincular", "Link")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
