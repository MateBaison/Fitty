import "server-only";
import { verifiedUser } from "@/lib/supabase/account-reader";
import { publicEnv, trustedOrigin } from "@/lib/env";
import { handleSupportPost, SupportBurstGuard } from "@/lib/support/handler";
import { sendSupportEmail, supportConfigured } from "@/lib/support/resend";
export const runtime = "nodejs";
const guard = new SupportBurstGuard();
export async function POST(request: Request) {
  return handleSupportPost(request, {
    originAllowed: (origin) => trustedOrigin(origin, publicEnv().site),
    user: async () => {
      const user = await verifiedUser();
      return user ? { id: user.id, email: user.email } : null;
    },
    configured: supportConfigured,
    guard,
    send: sendSupportEmail,
  });
}
