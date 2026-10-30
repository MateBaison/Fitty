import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Signs in with Google or Apple through Supabase OAuth (PKCE) in the system
 * browser sheet, then exchanges the returned code for a session.
 * Returns false when the person cancels.
 */
export async function signInWithProvider(provider: "google" | "apple") {
  // fitty://auth-callback in builds; exp://…/--/auth-callback in Expo Go.
  const redirectTo = Linking.createURL("auth-callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error("No pudimos iniciar sesión.");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.slice(1));
  url.searchParams.forEach((value, key) => params.set(key, value));
  const failure = params.get("error_description") ?? params.get("error");
  if (failure) throw new Error("No pudimos completar el inicio de sesión.");
  const code = params.get("code");
  if (!code) throw new Error("No pudimos completar el inicio de sesión.");
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  if (exchanged.error)
    throw new Error("No pudimos completar el inicio de sesión.");
  return true;
}
