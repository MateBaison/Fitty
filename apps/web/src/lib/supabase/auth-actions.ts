"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv, trustedOrigin } from "@/lib/env";
import { serverClient } from "./server";
async function assertOrigin() {
  const origin = (await headers()).get("origin");
  if (!trustedOrigin(origin, publicEnv().site))
    throw new Error("Origen no autorizado. Revisá la URL configurada.");
  return origin!;
}
const emailSchema = z.email().max(254);
export async function requestCode(email: string): Promise<{ error?: string }> {
  await assertOrigin();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: "Ingresá un correo válido." };
  const client = await serverClient();
  const { error } = await client.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  return error
    ? {
        error:
          "No pudimos enviar el código. Revisá el correo o esperá antes de reintentar.",
      }
    : {};
}
export async function verifyCode(
  email: string,
  token: string,
): Promise<{ error?: string }> {
  await assertOrigin();
  const parsed = z
    .object({ email: emailSchema, token: z.string().regex(/^\d{6,8}$/) })
    .safeParse({ email, token });
  if (!parsed.success) return { error: "Ingresá el código de 6 a 8 dígitos." };
  const client = await serverClient();
  const { error } = await client.auth.verifyOtp({
    ...parsed.data,
    type: "email",
  });
  return error ? { error: "El código no es válido o venció." } : {};
}
export async function googleLogin() {
  const origin = await assertOrigin();
  const client = await serverClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", origin).href,
      skipBrowserRedirect: true,
      // Always let the person choose the Google account instead of reusing the last one.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) throw new Error("No pudimos iniciar Google.");
  redirect(data.url);
}
export async function appleLogin() {
  const origin = await assertOrigin();
  const client = await serverClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: new URL("/auth/callback", origin).href,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) throw new Error("No pudimos iniciar Apple.");
  redirect(data.url);
}
export async function linkProvider(
  provider: "google" | "apple",
): Promise<{ error?: string }> {
  const origin = await assertOrigin();
  const client = await serverClient();
  const { data, error } = await client.auth.linkIdentity({
    provider,
    options: {
      redirectTo: new URL("/auth/callback?next=/profile", origin).href,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return { error: "link" };
  redirect(data.url);
}
export async function unlinkProvider(
  provider: "google" | "apple",
): Promise<{ error?: string }> {
  await assertOrigin();
  const client = await serverClient();
  const { data } = await client.auth.getUserIdentities();
  const identities = data?.identities ?? [];
  const target = identities.find((identity) => identity.provider === provider);
  // Never leave an account without a way to sign in.
  if (!target || identities.length < 2) return { error: "last" };
  const { error } = await client.auth.unlinkIdentity(target);
  return error ? { error: "unlink" } : {};
}
export async function signOut() {
  await assertOrigin();
  const client = await serverClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error)
    return {
      error: "No se pudo cerrar sesión. Reintentá cuando tengas conexión.",
    };
  redirect("/login");
}

export async function deleteAccount(input: {
  confirmation: string;
  email: string;
  acknowledged: boolean;
}): Promise<{ deleted?: true; error?: string }> {
  await assertOrigin();
  const client = await serverClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user?.email) return { error: "session" };
  if (
    input.confirmation !== "ELIMINAR" ||
    input.email !== user.email ||
    input.acknowledged !== true
  )
    return { error: "confirmation" };
  const result = await client.functions.invoke("delete-account", {
    body: input,
  });
  if (result.error || result.data?.deleted !== true)
    return { error: "unavailable" };
  return { deleted: true };
}
