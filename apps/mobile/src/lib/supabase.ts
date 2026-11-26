import { createClient, type Session } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { env } from "./env";
import { secureStorage } from "./secure-storage";

// Supabase's default name, spelled out so the saved session can be read offline.
export const authStorageKey = `sb-${new URL(env.supabaseUrl).hostname.split(".")[0]}-auth-token`;

// Supabase is used only for sign-in; account data goes through the Fitty API.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: secureStorage,
    storageKey: authStorageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // OAuth returns a one-time code to the app; the verifier never leaves the device.
    flowType: "pkce",
  },
});

/**
 * The session kept in the keychain. Supabase deletes it on sign-out or when the
 * server rejects it, so while it exists the user is still signed in.
 */
export async function savedSession(): Promise<Session | null> {
  try {
    const raw = await secureStorage.getItem(authStorageKey);
    const session = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    return session?.user?.id && session.refresh_token
      ? (session as Session)
      : null;
  } catch {
    return null;
  }
}

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
