"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";

/** Goes back in history, or to Home when the page was opened directly. */
export function BackButton() {
  const router = useRouter();
  const { t } = useApp();
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="back-button"
      aria-label={t("Volver", "Back")}
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push("/home")
      }
    >
      <ChevronLeft aria-hidden="true" />
    </Button>
  );
}
