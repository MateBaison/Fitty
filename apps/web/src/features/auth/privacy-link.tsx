"use client";
import { useEffect, useState } from "react";
import { languages, privacyNotice } from "@fitty/core/data/translations";

/** "By continuing you accept the Privacy policy." with the policy name linking to it in the chosen language. */
export function PrivacyLink() {
  const [language, setLanguage] = useState("es");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fitty-language");
      if (languages.some((code) => code === saved)) setLanguage(saved!);
    } catch {
      /* Storage can be unavailable; Spanish remains. */
    }
    const update = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (languages.some((code) => code === next)) setLanguage(next);
    };
    window.addEventListener("fitty-language-change", update);
    return () => window.removeEventListener("fitty-language-change", update);
  }, []);
  const notice = privacyNotice(language);
  return (
    <>
      {notice.before}
      <a
        href={`/privacidad?lang=${language}`}
        className="text-primary underline"
      >
        {notice.link}
      </a>
      {notice.after}
    </>
  );
}
