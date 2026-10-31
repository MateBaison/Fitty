import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorCode } from "@fitty/core/api/v1";
import { publicEnv } from "@/lib/env";

const noStore = { "Cache-Control": "private, no-store" };

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}
export function apiError(error: string, code: ApiErrorCode, status: number) {
  return apiJson({ error, code }, status);
}

/**
 * Verifies a mobile `Authorization: Bearer <access token>` remotely and returns a
 * client that acts as that user, so table policies still scope every query.
 */
export async function bearerAccount(
  request: Request,
): Promise<{
  client: SupabaseClient;
  userId: string;
  email: string | undefined;
} | null> {
  const match = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(
    request.headers.get("authorization") ?? "",
  );
  if (!match) return null;
  const env = publicEnv();
  const client = createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
  });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user) return null;
  return {
    client,
    userId: z.uuid().parse(data.user.id),
    email: data.user.email ?? undefined,
  };
}
