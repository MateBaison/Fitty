"use client";
import { AppProvider } from "@/state/app-provider";
import { OnboardingFlow } from "./onboarding-flow";
export function OnboardingScreen({
  user,
}: {
  user: { id: string; email: string };
}) {
  return (
    <AppProvider key={user.id} user={user}>
      <main className="panel">
        <OnboardingFlow />
      </main>
    </AppProvider>
  );
}
