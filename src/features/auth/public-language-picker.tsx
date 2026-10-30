"use client";

import { useEffect, useState } from "react";
import { languages, localeFor } from "@/data/translations";

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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("fitty-language");
    if (languages.some((item) => item === saved))
      setLanguage(saved as (typeof languages)[number]);
  }, []);
  const choose = (item: (typeof languages)[number]) => {
    const next = localeFor(item);
    window.localStorage.setItem("fitty-language", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    setLanguage(item);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("fitty-language-change", { detail: next }));
  };
  return (
    <details
      className="public-language-picker"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label="Idioma / Language">{names[language]}</summary>
      <div className="public-language-options" role="listbox" aria-label="Idiomas">
        {languages.map((item) => (
          <button
            type="button"
            role="option"
            aria-selected={language === item}
            key={item}
            onClick={() => choose(item)}
          >
            <span aria-hidden="true">{flags[item]}</span>
            {names[item]}
          </button>
        ))}
      </div>
    </details>
  );
}
