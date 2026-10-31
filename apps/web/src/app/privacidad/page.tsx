import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { languages, textDirection } from "@fitty/core/data/translations";
import { policies } from "./content";

export const metadata: Metadata = {
  title: "Política de privacidad / Privacy policy",
  description: "Qué datos usa Fitty, para qué y cómo podés controlarlos.",
};

const contact = "soporte@fitty.uy";
const pick = (value: unknown) =>
  typeof value === "string" && languages.some((code) => code === value)
    ? value
    : null;

/** Shows the policy in one language: ?lang=, else the browser's language, else Spanish. */
async function chosenLanguage(requested: unknown) {
  const explicit = pick(requested);
  if (explicit) return explicit;
  const accepted = (await headers()).get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const code = pick(part.trim().slice(0, 2).toLowerCase());
    if (code) return code;
  }
  return "es";
}

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const language = await chosenLanguage(Array.isArray(lang) ? lang[0] : lang);
  const page = policies[language] ?? policies.es!;
  return (
    <main
      lang={language}
      dir={textDirection(language)}
      className="mx-auto max-w-[760px] space-y-6 p-6 pb-16"
    >
      <nav className="text-sm">
        <Link href="/home" className="text-primary underline">
          Fitty
        </Link>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{page.heading}</h1>
        <p className="text-sm text-muted-foreground">{page.updated}</p>
        <p>{page.intro}</p>
      </header>
      {page.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <ul className="list-disc space-y-2 ps-5">
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm">
        <a href={`mailto:${contact}`} className="underline">
          {contact}
        </a>
      </p>
    </main>
  );
}
