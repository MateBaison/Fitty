import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { translate } from "@fitty/core/data/translations";
import type { Snapshot } from "@fitty/core/domain/schemas/snapshot";
import { adoptPreviousAccountCache } from "@fitty/core/storage/account-cache";
import {
  SyncController,
  type SyncView,
} from "@fitty/core/sync/sync-controller";
import { api } from "@/lib/api";
import { queryStateRepository } from "@/lib/state-repository";

type Account = {
  view: SyncView;
  /** Applies a persisted edit; returns false and shows the error when it throws. */
  change: (edit: (draft: Snapshot) => void) => boolean;
  flush: () => Promise<boolean>;
  resolve: (choice: "cloud" | "local") => void;
  retry: () => void;
  t: (spanish: string, english: string) => string;
  notice: string;
  notify: (message: string) => void;
};
const AccountContext = createContext<Account | null>(null);

export function AccountProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const controller = useRef<SyncController | null>(null);
  const [view, setView] = useState<SyncView>({
    snapshot: null,
    status: "loading",
    message: "",
  });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      adoptPreviousAccountCache(localStorage, userId);
    } catch {
      // Storage may be unavailable; SyncController reports that state itself.
    }
    const sync = new SyncController(
      userId,
      queryStateRepository(queryClient, api, userId),
      localStorage,
    );
    controller.current = sync;
    const unsubscribe = sync.subscribe(setView);
    void sync.start();
    // Same cadence as the web app: refresh on focus and every 30 s while visible.
    const interval = setInterval(() => {
      if (AppState.currentState === "active") void sync.refresh();
    }, 30000);
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync.refresh();
    });
    const online = onlineManager.subscribe((isOnline) => {
      if (isOnline) void sync.start();
    });
    return () => {
      clearInterval(interval);
      appState.remove();
      online();
      unsubscribe();
      sync.dispose();
      controller.current = null;
    };
  }, [queryClient, userId]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const language =
    view.snapshot?.settings.language ?? controller.current?.language ?? "es";
  const t = useCallback(
    (spanish: string, english: string) => translate(language, spanish, english),
    [language],
  );
  const change = useCallback((edit: (draft: Snapshot) => void) => {
    try {
      controller.current?.edit(edit);
      return Boolean(controller.current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, []);
  return (
    <AccountContext
      value={{
        view,
        change,
        flush: () => controller.current?.flush() ?? Promise.resolve(false),
        resolve: (choice) => controller.current?.resolve(choice),
        retry: () => void controller.current?.start(),
        t,
        notice,
        notify: setNotice,
      }}
    >
      {children}
    </AccountContext>
  );
}

export function useAccount() {
  const account = use(AccountContext);
  if (!account)
    throw new Error("useAccount must be used inside AccountProvider");
  return account;
}

/** The loaded snapshot; only call inside screens rendered after loading. */
export function useSnapshot(): Snapshot {
  const snapshot = useAccount().view.snapshot;
  if (!snapshot) throw new Error("The account is not loaded yet");
  return snapshot;
}
