"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { LocalizedText } from "@/components/localized-text";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-6" role="alert">
      <h1 className="text-2xl font-bold">
        <LocalizedText
          es="No pudimos cargar esta pantalla"
          en="We could not load this screen"
        />
      </h1>
      <p>
        <LocalizedText
          es="Tus datos no se han reemplazado. Podés volver a intentarlo."
          en="Your data has not been replaced. You can try again."
        />
      </p>
      <Button onClick={reset}>
        <LocalizedText es="Reintentar" en="Try again" />
      </Button>
    </div>
  );
}
