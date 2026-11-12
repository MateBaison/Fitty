"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { LocalizedText } from "@/components/localized-text";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="es">
      <body style={{ background: "#090b10", color: "#fff", padding: 24 }}>
        <h1>
          <LocalizedText es="No pudimos cargar Fitty" en="We could not load Fitty" />
        </h1>
        <p>
          <LocalizedText
            es="Recargá la página para volver a intentarlo."
            en="Reload the page to try again."
          />
        </p>
      </body>
    </html>
  );
}
