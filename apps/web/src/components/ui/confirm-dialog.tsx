"use client";
import { useCallback, useRef, useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/app-provider";

type Request = {
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
};

/**
 * In-app replacement for window.confirm, which browsers can silently suppress
 * (home-screen apps, in-app browsers, "block further dialogs"). Render `dialog`
 * once and `await ask(...)` where confirm() was used.
 */
export function useConfirm() {
  const { t } = useApp();
  const [request, setRequest] = useState<Request | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }, []);
  const ask = useCallback(
    (message: string, options: Omit<Request, "message"> = {}) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setRequest({ message, ...options });
      }),
    [],
  );
  const dialog = (
    <AppDialog
      open={request !== null}
      onClose={() => settle(false)}
      title={t("Confirmar", "Confirm")}
    >
      <p>{request?.message}</p>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => settle(false)}>
          {t("Volver", "Back")}
        </Button>
        <Button
          type="button"
          variant={request?.destructive ? "destructive-solid" : "default"}
          onClick={() => settle(true)}
        >
          {request?.confirmLabel ?? t("Confirmar", "Confirm")}
        </Button>
      </div>
    </AppDialog>
  );
  return [ask, dialog] as const;
}
