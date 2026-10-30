import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { env } from "./env";

// Supabase is used only for sign-in; account data goes through the Fitty API.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // OAuth returns a one-time code to the app; the verifier never leaves the device.
    flowType: "pkce",
  },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
