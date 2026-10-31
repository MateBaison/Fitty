import "server-only";
import { z } from "zod";
import type { SupportEmail } from "./handler";

/** True when a Resend key is configured; shared by the web and mobile support routes. */
export function supportConfigured() {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key?.startsWith("re_") && key.length > 20);
}

export async function sendSupportEmail(email: SupportEmail, idempotency: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotency,
    },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Support mail unavailable");
  return z
    .object({ id: z.string().min(1).max(100) })
    .parse(await response.json());
}
