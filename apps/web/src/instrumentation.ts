import * as Sentry from "@sentry/nextjs";

// Error reports are sent only when NEXT_PUBLIC_SENTRY_DSN is set.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    tracesSampleRate: 0,
  });
}

export const onRequestError = Sentry.captureRequestError;
