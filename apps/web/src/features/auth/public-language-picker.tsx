"use client";

import { useEffect, useState } from "react";
import { languages, localeFor } from "@fitty/core/data/translations";

const names: Record<(typeof languages)[number], string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};
const flags: Record<(typeof languages)[number], string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  zh: "🇨🇳",
  hi: "🇮🇳",
  ar: "🇸🇦",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
};

export function PublicLanguagePicker() {
  const [language, setLanguage] = useState<(typeof languages)[number]>("es");
  useEffect(() => {
    const saved = window.localStorage.getItem("fitty-language");
    if (languages.some((item) => item === saved))
      setLanguage(saved as (typeof languages)[number]);
  }, []);
  return (
    <label className="public-language-picker">
      <span className="sr-only">Idioma / Language</span>
      <select
        aria-label="Idioma / Language"
        value={language}
        onChange={(event) => {
          const next = localeFor(event.target.value);
          window.localStorage.setItem("fitty-language", next);
          document.documentElement.lang = next;
          document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
          setLanguage(next as (typeof languages)[number]);
          window.dispatchEvent(new CustomEvent("fitty-language-change", { detail: next }));
        }}
      >
        {languages.map((item) => (
          <option value={item} key={item}>{flags[item]} {names[item]}</option>
        ))}
      </select>
    </label>
  );
}
