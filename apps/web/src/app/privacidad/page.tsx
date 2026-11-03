import type { Metadata } from "next";
import { LegalPage } from "../legal-page";
import { policies } from "./content";

export const metadata: Metadata = {
  title: "Política de privacidad / Privacy policy",
  description: "Qué datos usa Fitty, para qué y cómo podés controlarlos.",
};

export default function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  return <LegalPage documents={policies} searchParams={searchParams} />;
}
