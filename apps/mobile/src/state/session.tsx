import type { Session } from "@supabase/supabase-js";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { savedSession, supabase } from "@/lib/supabase";

type SessionState = { session: Session | null; loading: boolean };
const SessionContext = createContext<SessionState>({
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  });
  useEffect(() => {
    const open = (session: Session | null) =>
      setState({ session, loading: false });
    // Without a connection Supabase cannot renew an expired token and reports no
    // session although nobody signed out, so the saved one opens the app.
    void savedSession().then((saved) => {
      if (saved)
        setState((state) =>
          state.loading ? { session: saved, loading: false } : state,
        );
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === "SIGNED_OUT") open(session);
      else void savedSession().then(open);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <SessionContext value={state}>{children}</SessionContext>;
}

export const useSession = () => use(SessionContext);
