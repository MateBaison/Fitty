# Fitty

Fitty (formerly HERCULES) is a fitness app for logging routines, workouts, sets and progress. It is published at **https://fitty.uy** and is being extended with native iOS/Android apps.

## Repository layout

This is a [Turborepo](https://turborepo.com) monorepo managed with [pnpm](https://pnpm.io) workspaces.

| Path | Package | What it is |
| --- | --- | --- |
| `apps/web` | `@fitty/web` | Next.js App Router web app deployed to Vercel (fitty.uy). Also serves the API used by the mobile app. |
| `apps/mobile` | `@fitty/mobile` | Expo / React Native app for iOS and Android. |
| `packages/core` | `@fitty/core` | Platform-independent logic shared by both apps: exercise catalog, translations, Zod schemas, workout/progress calculations and snapshot sync. |
| `supabase/` | — | Supabase configuration and edge functions. |
| `docs/` | — | Data compatibility, deployment, branding and status notes. |

## Getting started

Requires Node.js 20.9+ and pnpm 10.

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local   # then fill in the public Supabase values
pnpm --filter @fitty/web dev --hostname localhost --port 3000
```

Open **http://localhost:3000**. Use `localhost`, not `127.0.0.1`: authentication verifies the request origin. Only public values belong in `.env.local`; no service-role key or provider secret is used by the app.

## Common commands

Run from the repository root:

```sh
pnpm typecheck     # every package
pnpm test          # unit tests (Vitest) for every package
pnpm build         # production builds
pnpm --filter @fitty/web baseline:verify
pnpm --filter @fitty/web test:build && pnpm --filter @fitty/web test:browser
```

Browser tests use a separate `.next-test` build and a loopback mock Supabase on ports 3010/54329, in mobile and desktop viewports. Install Chromium once with `pnpm --filter @fitty/web exec playwright install chromium`.

## Deployment

Every push to `main` deploys `apps/web` to production on Vercel (project root directory `apps/web`). See [deployment and rollback](docs/deployment-and-rollback.md) and [data compatibility](docs/data-compatibility.md).
