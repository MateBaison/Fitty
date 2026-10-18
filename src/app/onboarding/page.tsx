import { redirect } from "next/navigation";
import { verifiedUser, accountSummary } from "@/lib/supabase/account-reader";
import { configured } from "@/lib/env";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
export default async function OnboardingPage() {
  if (!configured()) redirect("/login");
  const user = await verifiedUser();
  if (!user) redirect("/login");
  if ((await accountSummary(user.id)).complete) redirect("/home");
  return (
    <div className="app-shell">
      <OnboardingScreen user={{ id: user.id, email: user.email ?? "" }} />
    </div>
  );
}
