"use client";
import { useEffect, useState } from "react";
import { localeFor, translate } from "@/data/translations";
export function PublicLanguageHeading() {
  const [language, setLanguage] = useState("es");
  useEffect(() => {
    setLanguage(localeFor(localStorage.getItem("fitty-language") ?? "es"));
    const update = (event: Event) =>
      setLanguage(localeFor((event as CustomEvent<string>).detail));
    window.addEventListener("fitty-language-change", update);
    return () => window.removeEventListener("fitty-language-change", update);
  }, []);
  return <h1>{translate(language, "Iniciar sesión", "Sign in")}</h1>;
}
