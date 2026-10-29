# Account deletion

The profile Settings control has an explicit safety acknowledgement, the account email and the exact phrase `ELIMINAR`. These are accident-prevention confirmations, not a CAPTCHA or proof of fresh identity. The Next.js action checks request origin and verifies the user with Supabase before forwarding the confirmation to `delete-account`.

## Hosted setup

Deploy `supabase/functions/delete-account/index.ts` as the Supabase Edge Function named `delete-account` in project `pebgpdnaihnfjtbrjbto`. The runtime uses Supabase's built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; do not copy this key into Next.js, public environment variables or the browser. The function verifies the bearer token with Auth, derives the account ID itself, and checks all confirmations again. It accepts no target user ID.

Before enabling, verify that the live `public.Fitty_State.user_id` foreign key references `auth.users.id` with `ON DELETE CASCADE`, as the archived setup specifies. Auth's admin deletion must delete the user and its dependent records atomically; never delete the snapshot first. Existing Storage objects owned by the user can prevent deletion. Current photos reside in snapshots; future Storage adoption needs explicit cleanup design. Failed deletions leave local records intact.

Only after confirmed backend success does the client dispose synchronization, remove this account's local cache and recovery copies, sign out and return to login. Other devices' private caches cannot be remotely erased. Downloaded exports also remain with their owner. Existing access tokens may remain cryptographically valid until expiry, so the live FK and RLS are required to prevent stale writes after deletion.

The Edge Function was deployed via the Supabase dashboard on 2026-10-11. The live foreign key was queried and confirmed as `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`. The legacy-secret-only gateway check is disabled (`supabase/config.toml`); the function itself verifies every bearer token with Auth, supporting the current signing keys. A dashboard POST with no valid user session returned HTTP 401 with `unauthorized`, confirming that deployed code runs and rejects unauthenticated requests.

No real account was deleted during verification. Mobile/desktop mock tests cover confirmations, failed deletion, successful deletion/logout/cache removal and preservation of another account's cache. Real-provider successful deletion remains unverified because no disposable hosted account was authorized for deletion. A Vercel Git push does not deploy future changes to this Edge Function; redeploy it separately.
