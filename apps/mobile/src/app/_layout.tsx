import "@/lib/polyfills";
import "@/lib/tracking-feed";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LaunchSplash } from "@/components/launch-splash";
import { queryClient, queryPersister } from "@/lib/query-client";
import { SessionProvider, useSession } from "@/state/session";
import { colors } from "@/theme";

// Error reports are sent only when a Sentry DSN is configured; no personal data is attached.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN) && !__DEV__,
  sendDefaultPii: false,
  tracesSampleRate: 0,
});

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

function RootLayout() {
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

export default Sentry.wrap(RootLayout);
