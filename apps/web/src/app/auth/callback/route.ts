import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { publicEnv, safeNext, trustedOrigin } from "@/lib/env";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    env = publicEnv(),
    origin = trustedOrigin(url.origin, env.site) ? url.origin : env.site;
  if (code) {
    const client = await serverClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    const { data } = await client.auth.getUser();
    if (!error && data.user)
      return NextResponse.redirect(
        new URL(safeNext(url.searchParams.get("next")), origin),
        { headers: { "Cache-Control": "private, no-store" } },
      );
  }
  // Linking another sign-in method can fail (for example, it already belongs to another account).
  if (url.searchParams.get("error_code") === "identity_already_exists") {
    const client = await serverClient();
    const { data } = await client.auth.getUser();
    if (data.user)
      return NextResponse.redirect(
        new URL("/profile?linkError=exists", origin),
        { headers: { "Cache-Control": "private, no-store" } },
      );
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
