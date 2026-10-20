import "server-only";
import { verifiedUser } from "@/lib/supabase/account-reader";
import { publicEnv, trustedOrigin } from "@/lib/env";
import { handleSupportPost, SupportBurstGuard } from "@/lib/support/handler";
import { z } from "zod";
export const runtime = "nodejs";
const guard = new SupportBurstGuard();
export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  return handleSupportPost(request, {
    originAllowed: (origin) => trustedOrigin(origin, publicEnv().site),
    user: async () => {
      const user = await verifiedUser();
      return user ? { id: user.id, email: user.email } : null;
    },
    configured: () => Boolean(key?.startsWith("re_") && key.length > 20),
    guard,
    send: async (email, idempotency) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
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
    },
  });
}
