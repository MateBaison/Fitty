import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Signs in with Google or Apple through Supabase OAuth (PKCE) in the system
 * browser sheet, then exchanges the returned code for a session.
 * Returns false when the person cancels.
 */
export async function signInWithProvider(provider: "google" | "apple") {
  return completeOAuth(provider, "signIn");
}

/** Adds Google or Apple as another way to sign in to the current account. */
export async function linkProvider(provider: "google" | "apple") {
  return completeOAuth(provider, "link");
}

async function completeOAuth(
  provider: "google" | "apple",
  purpose: "signIn" | "link",
) {
  // fitty://auth-callback in builds; exp://…/--/auth-callback in Expo Go.
  const redirectTo = Linking.createURL("auth-callback");
  const options = { redirectTo, skipBrowserRedirect: true };
  const { data, error } =
    purpose === "link"
      ? await supabase.auth.linkIdentity({ provider, options })
      : await supabase.auth.signInWithOAuth({ provider, options });
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

/**
 * Native "Sign in with Apple" on iOS: Apple returns an identity token that
 * Supabase verifies directly, with no browser sheet. Falls back to the web
 * flow when the native sheet is unavailable (Android, Expo Go, simulators)
 * or Apple's token is rejected. Returns false when the person cancels.
 */
export async function signInWithApple() {
  if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync()))
    return signInWithProvider("apple");
  // Apple receives the hash of the nonce; Supabase checks the raw value against the token.
  const nonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce,
  );
  let identityToken: string | null;
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    identityToken = credential.identityToken;
  } catch (error) {
    if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED")
      return false;
    return signInWithProvider("apple");
  }
  if (!identityToken) return signInWithProvider("apple");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce,
  });
  // The token's audience must be an authorized client ID in Supabase; otherwise use the web flow.
  if (error) return signInWithProvider("apple");
  return true;
}
