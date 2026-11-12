"use client";
import { useEffect, useState } from "react";
import { localeFor, translate } from "@fitty/core/data/translations";

/** Text for pages without account state (errors, 404): uses the language saved on this device. */
export function LocalizedText({ es, en }: { es: string; en: string }) {
  const [language, setLanguage] = useState("es");
  useEffect(() => {
    try {
      setLanguage(localeFor(localStorage.getItem("fitty-language") ?? "es"));
    } catch {
      /* Spanish remains when storage is unavailable. */
    }
  }, []);
  return <>{translate(language, es, en)}</>;
}
