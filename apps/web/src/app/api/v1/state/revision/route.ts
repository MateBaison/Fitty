import { z } from "zod";
import { apiError, apiJson, bearerAccount } from "@/lib/supabase/bearer";

export async function GET(request: Request) {
  const account = await bearerAccount(request);
  if (!account) return apiError("Iniciá sesión de nuevo.", "unauthorized", 401);
  const { data, error } = await account.client
    .from("Fitty_State")
    .select("updated_at")
    .eq("user_id", account.userId)
    .maybeSingle();
  if (error)
    return apiError("No pudimos comprobar la sincronización.", "failed", 502);
  return apiJson({
    updatedAt:
      z
        .object({ updated_at: z.string() })
        .nullable()
        .parse(data as unknown)?.updated_at ?? null,
  });
}
