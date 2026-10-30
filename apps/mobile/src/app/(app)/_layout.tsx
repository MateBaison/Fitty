import { Tabs } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { View, type ColorValue } from "react-native";
import { Onboarding } from "@/components/onboarding";
import { Button, Card, Label, Loading, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { AccountProvider, useAccount } from "@/state/account";
import { useSession } from "@/state/session";
import { colors } from "@/theme";

function icon(name: SymbolViewProps["name"]) {
  return ({ color }: { color: ColorValue }) => (
    <SymbolView name={name} tintColor={color} size={24} />
  );
}

function AccountGate() {
  const { view, resolve, retry, t } = useAccount();
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
          <Button variant="ghost" onPress={() => void supabase.auth.signOut()}>
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
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("Inicio", "Home"),
            tabBarIcon: icon({ ios: "house.fill", android: "home" }),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: t("Ejercicios", "Exercises"),
            tabBarIcon: icon({
              ios: "dumbbell.fill",
              android: "fitness_center",
            }),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t("Progreso", "Progress"),
            tabBarIcon: icon({ ios: "chart.bar.fill", android: "bar_chart" }),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: t("Herramientas", "Tools"),
            tabBarIcon: icon({ ios: "stopwatch.fill", android: "timer" }),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("Perfil", "Profile"),
            tabBarIcon: icon({
              ios: "person.crop.circle.fill",
              android: "account_circle",
            }),
          }}
        />
        <Tabs.Screen name="workout" options={{ href: null }} />
        <Tabs.Screen name="routines" options={{ href: null }} />
      </Tabs>
    </View>
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
