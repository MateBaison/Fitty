"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

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
        <h1>No pudimos cargar Fitty</h1>
        <p>Recargá la página para volver a intentarlo.</p>
      </body>
    </html>
  );
}
