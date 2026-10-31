import { z } from "zod";
import raw from "./legacy/translations.json";
import additions from "./ui-translations.json";
const uiTranslations: Record<string, Record<string, string>> = additions;
const translations = z
  .record(z.string(), z.record(z.string(), z.string()))
  .parse(raw);
export function translate(
  language: string,
  spanish: string,
  english: string,
): string {
  return language === "es"
    ? spanish
    : language === "en"
      ? english === spanish
        ? (uiTranslations.en?.[spanish] ?? english)
        : english
      : (uiTranslations[language]?.[spanish] ??
        translations[language]?.[spanish] ??
        english);
}
export const languages = [
  "es",
  "en",
  "fr",
  "zh",
  "hi",
  "ar",
  "de",
  "it",
  "pt",
] as const;
export function textDirection(language: string): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}
export function localeFor(language?: string): string {
  return languages.some((known) => known === language) ? language! : "es";
}
/** "By continuing you accept the Privacy policy." split around the policy name so it can be a link. */
export function privacyNotice(language: string): {
  before: string;
  link: string;
  after: string;
} {
  const sentence = translate(
    language,
    "Al continuar aceptás la Política de privacidad.",
    "By continuing you accept the Privacy policy.",
  );
  const link = translate(language, "Política de privacidad", "Privacy policy");
  const index = sentence.toLowerCase().indexOf(link.toLowerCase());
  if (index < 0) return { before: sentence, link: "", after: "" };
  return {
    before: sentence.slice(0, index),
    link: sentence.slice(index, index + link.length),
    after: sentence.slice(index + link.length),
  };
}
