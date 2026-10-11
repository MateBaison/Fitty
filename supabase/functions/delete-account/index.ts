// Runs only in Supabase Edge Functions; admin credentials never reach Next.js or the browser.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
Deno.serve(async (request: Request) => {
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  if (request.method !== "POST") return reply({ error: "method" }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    return reply({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(authorization.slice(7));
  if (error || !user?.email || user.is_anonymous)
    return reply({ error: "unauthorized" }, 401);
  let input;
  try {
    input = await request.json();
  } catch {
    return reply({ error: "confirmation" }, 400);
  }
  if (
    input?.confirmation !== "ELIMINAR" ||
    input?.email !== user.email ||
    input?.acknowledged !== true
  )
    return reply({ error: "confirmation" }, 400);
  // auth.users deletion cascades to mrgymson_state and auth sessions. A database/storage
  // failure must leave the account intact: never delete the snapshot in a separate call.
  const result = await admin.auth.admin.deleteUser(user.id);
  if (result.error) return reply({ error: "deletion_failed" }, 409);
  return reply({ deleted: true });
});
