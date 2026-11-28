import { Tabs, usePathname } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import {
  BAR_HEIGHT,
  barOffset,
  BottomSpace,
  DRAWER_HEIGHT,
} from "@/components/bottom-space";
import { Onboarding } from "@/components/onboarding";
import { Button, Card, Label, Loading, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { AccountProvider, useAccount, useSnapshot } from "@/state/account";
import { RestProvider, useRest } from "@/state/rest";
import { useSession } from "@/state/session";
import { colors } from "@/theme";

/** Room below the screens for the bar and the panels that come out above it. */
function BarSpace({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { rest } = useRest();
  const workout = useSnapshot().workout;
  const home = usePathname() === "/";
  const panels = (rest ? 1 : 0) + (home && workout ? 1 : 0);
  return (
    <BottomSpace
      value={BAR_HEIGHT + barOffset(insets.bottom) + panels * DRAWER_HEIGHT}
    >
      {children}
    </BottomSpace>
  );
}

function AccountGate() {
  const { view, resolve, retry, t } = useAccount();
  const insets = useSafeAreaInsets();
  if (view.status === "conflict")
    return (
      <Screen>
        <Title>
          {t("Elegí qué copia conservar", "Choose which copy to keep")}
        </Title>
        <Card>
          <Label>{view.message}</Label>
          <Label muted>
            {t(
              "Este teléfono y la nube tienen cambios distintos. La otra copia queda respaldada en el dispositivo.",
              "This phone and the cloud have different changes. The other copy is backed up on the device.",
            )}
          </Label>
          <Button onPress={() => resolve("cloud")}>
            {t("Usar la copia de la nube", "Use the cloud copy")}
          </Button>
          <Button variant="secondary" onPress={() => resolve("local")}>
            {t("Usar la copia de este teléfono", "Use this phone's copy")}
          </Button>
        </Card>
      </Screen>
    );
  if (!view.snapshot && view.status === "error")
    return (
      <Screen>
        <Title>
          {t("No pudimos cargar tu cuenta", "We couldn't load your account")}
        </Title>
        <Card>
          <Label>{view.message}</Label>
          <Button onPress={retry}>{t("Reintentar", "Retry")}</Button>
          <Button variant="secondary" onPress={() => void supabase.auth.signOut()}>
            {t("Cerrar sesión", "Sign out")}
          </Button>
        </Card>
      </Screen>
    );
  if (!view.snapshot) return <Loading message={view.message} />;
  // Same rule as the web account summary: a name or the flag marks completion.
  if (
    !view.snapshot.profile.onboardingComplete &&
    !view.snapshot.profile.name?.trim()
  )
    return <Onboarding />;
  return (
    <RestProvider>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <BarSpace>
          <Tabs
            tabBar={() => <BottomNav />}
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: colors.background },
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="professionals" />
            <Tabs.Screen name="tools" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="library" />
            <Tabs.Screen name="progress" />
            <Tabs.Screen name="workout" />
            <Tabs.Screen name="routines" />
            <Tabs.Screen name="body" />
            <Tabs.Screen name="combat" />
          </Tabs>
        </BarSpace>
      </SafeAreaInsetsContext.Provider>
    </View>
    </RestProvider>
  );
}

export default function AppLayout() {
  const { session } = useSession();
  if (!session) return null;
  return (
    <AccountProvider userId={session.user.id}>
      <AccountGate />
    </AccountProvider>
  );
}
