import "server-only";
import { bearerAccount } from "@/lib/supabase/bearer";
import { handleSupportPost, SupportBurstGuard } from "@/lib/support/handler";
import { sendSupportEmail, supportConfigured } from "@/lib/support/resend";
export const runtime = "nodejs";
const guard = new SupportBurstGuard();
/**
 * Support form for the mobile app. It is authenticated by a Bearer token, which a
 * browser cannot attach on its own, so the cookie-oriented Origin check does not apply.
 */
export async function POST(request: Request) {
  return handleSupportPost(request, {
    originAllowed: () => true,
    user: async () => {
      const account = await bearerAccount(request);
      return account ? { id: account.userId, email: account.email } : null;
    },
    configured: supportConfigured,
    guard,
    send: sendSupportEmail,
  });
}
