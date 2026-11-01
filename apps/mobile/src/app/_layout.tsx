import "@/lib/polyfills";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LaunchSplash } from "@/components/launch-splash";
import { queryClient, queryPersister } from "@/lib/query-client";
import { SessionProvider, useSession } from "@/state/session";
import { colors } from "@/theme";

void SplashScreen.preventAutoHideAsync();

function Routes() {
  const { session, loading } = useSession();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  if (loading) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <SessionProvider>
        <StatusBar style="light" />
        <Routes />
        <LaunchSplash />
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}
