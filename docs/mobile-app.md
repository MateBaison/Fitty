# Mobile app (apps/mobile)

Expo / React Native app for iOS and Android. It shares `@fitty/core` with the web app and reads and writes account data through the web app's `/api/v1` routes. Supabase is used only for sign-in.

## Run it

```sh
pnpm install
pnpm --filter @fitty/mobile dev      # then scan the QR code with Expo Go
```

`apps/mobile/.env.local` (ignored) holds the public values from `.env.example`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL` (`https://fitty.uy`).

To test against the local mock backend instead, run `pnpm --filter @fitty/web exec tsx scripts/mock-supabase.ts`, start the web app with the mock values from `apps/web/scripts/test-env.ts` on port 3010, and start Expo with `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local_tests_only_not_real` and `EXPO_PUBLIC_API_URL=http://127.0.0.1:3010`. The mock accepts the email code `123456`.

## Sign-in with Google and Apple

Both use Supabase OAuth with PKCE in the system browser sheet (`src/lib/oauth.ts`), the same providers the web app uses. The browser returns to the app at `fitty://auth-callback` (installed builds) or `exp://<host>/--/auth-callback` (Expo Go).

Required one-time configuration in Supabase → Authentication → URL Configuration → Redirect URLs:

- `fitty://**` — installed iOS/Android builds.
- `exp://**` — only while testing in Expo Go; remove before public release if not needed.

Supabase falls back to the Site URL when a redirect is not allowlisted, which would open fitty.uy instead of returning to the app.

Before App Store submission, consider native Sign in with Apple (`expo-apple-authentication` + `signInWithIdToken`), which additionally needs the "Sign in with Apple" capability for `uy.fitty.app` in Apple Developer and `uy.fitty.app` added to the Apple provider's client IDs in Supabase.

## Right-to-left (Arabic)

The account language sets the direction (`textDirection` from `@fitty/core`), never the phone's: `Direction` in `src/lib/direction.tsx` wraps the app and sign-in, and switching language mirrors the screens at once, without a restart. When adding UI:

- Position with `start`/`end` (`marginStart`, `borderStartWidth`), not left/right.
- Use `Chevron` for back/forward arrows, `Switch` from `components/switch.tsx`, and `useInputAlign()` on text fields that are not centered.
- Wrap measurements such as "90 kg × 8" in `leftToRight()`, and mirror drag gestures with `useRTL()`.

The progress chart and the shareable workout poster are not mirrored.

## Limits

- Account snapshots travel through a Vercel Function, which rejects request bodies above 4.5 MB; very photo-heavy accounts get a clear "too large" error on mobile until photos move to storage.
- Route tracking (GPS) is not part of the app: its screen and the location libraries were removed so the build asks for no location permission. Saved `trackingSessions` stay in account data. Restore it from git history (before November 2026's removal commit) when the feature returns.
- Permission prompts follow the phone's language; their texts are in `apps/mobile/locales/`.

## Test and store builds (EAS)

`apps/mobile/eas.json` defines three profiles; the public Supabase/API values are baked in (no secrets). Run from `apps/mobile` after `eas login` with the Expo account that owns the project:

```sh
pnpm dlx eas-cli@latest init                                   # once: links the project and writes the project id into app.json
pnpm dlx eas-cli@latest build --profile preview --platform ios      # installable on registered iPhones / TestFlight
pnpm dlx eas-cli@latest build --profile preview --platform android  # APK for testers
pnpm dlx eas-cli@latest build --profile production --platform all   # store builds
pnpm dlx eas-cli@latest submit --profile production --platform ios  # upload to App Store Connect / TestFlight
```

Native Sign in with Apple only works in these real builds (bundle ID `uy.fitty.app` must be in Supabase's Apple "Client IDs"); Expo Go falls back to the browser flow. Google Play requires 12 testers for 14 consecutive days before production access on new personal accounts.
