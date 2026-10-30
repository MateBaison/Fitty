import { z } from "zod";
import { saveStateRequestSchema } from "@fitty/core/api/v1";
import { apiError, apiJson, bearerAccount } from "@/lib/supabase/bearer";

// Vercel Functions reject request bodies above 4.5 MB; fail clearly before that.
const MAX_BODY_BYTES = 4_400_000;
const unauthorized = () =>
  apiError("Iniciá sesión de nuevo.", "unauthorized", 401);

export async function GET(request: Request) {
  const account = await bearerAccount(request);
  if (!account) return unauthorized();
  const { data, error } = await account.client
    .from("Fitty_State")
    .select("payload,updated_at")
    .eq("user_id", account.userId)
    .maybeSingle();
  if (error) return apiError("No pudimos cargar tu cuenta.", "failed", 502);
  const row = z
    .object({ payload: z.unknown(), updated_at: z.string() })
    .nullable()
    .parse(data as unknown);
  return apiJson({
    payload: row?.payload ?? null,
    updatedAt: row?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const account = await bearerAccount(request);
  if (!account) return unauthorized();
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES)
    return apiError(
      "Tu cuenta es demasiado grande para sincronizar desde el móvil.",
      "too_large",
      413,
    );
  const input = saveStateRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success)
    return apiError("Los datos enviados no son válidos.", "invalid", 400);
  const revision = input.data.baseUpdatedAt;
  // Same monotonic revision rule as the browser repository.
  const updatedAt = new Date(
    Math.max(Date.now(), revision ? Date.parse(revision) + 1 : 0),
  ).toISOString();
  const values = {
    user_id: account.userId,
    payload: input.data.payload,
    updated_at: updatedAt,
  };
  const query =
    revision === null
      ? account.client.from("Fitty_State").insert(values)
      : account.client
          .from("Fitty_State")
          .update(values)
          .eq("user_id", account.userId)
          .eq("updated_at", revision);
  const { data, error } = await query.select("updated_at");
  if (error?.code === "23505" || (!error && (!data || data.length !== 1)))
    return apiError("Otro dispositivo modificó la cuenta.", "conflict", 409);
  if (error)
    return apiError(
      "No se pudo sincronizar. Tus cambios siguen guardados en este dispositivo.",
      "failed",
      502,
    );
  return apiJson({
    updatedAt: z
      .array(z.object({ updated_at: z.string() }))
      .length(1)
      .parse(data)[0]!.updated_at,
  });
}
