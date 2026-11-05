import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * app.json holds the real app. The development build (APP_VARIANT=development,
 * set in eas.json) gets its own name, identifier and URL scheme so it can sit
 * on the phone next to the TestFlight / App Store version instead of replacing it.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const development = process.env.APP_VARIANT === "development";
  if (!development) return config as ExpoConfig;
  return {
    ...config,
    name: "Fitty Dev",
    scheme: "fitty-dev",
    ios: { ...config.ios, bundleIdentifier: "uy.fitty.app.dev" },
    android: { ...config.android, package: "uy.fitty.app.dev" },
  } as ExpoConfig;
};
