"use client";
import { useEffect, useState } from "react";
import { languages, translate } from "@fitty/core/data/translations";

/** Privacy policy link in the visitor's chosen language (the same one the language picker saves). */
export function PrivacyLink() {
  const [language, setLanguage] = useState("es");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fitty-language");
      if (languages.some((code) => code === saved)) setLanguage(saved!);
    } catch {
      /* Storage can be unavailable; Spanish remains. */
    }
  }, []);
  return (
    <a href={`/privacidad?lang=${language}`} className="text-primary underline">
      {translate(language, "Política de privacidad", "Privacy policy")}
    </a>
  );
}
