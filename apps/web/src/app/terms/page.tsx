import type { Metadata } from "next";
import { LegalPage } from "../legal-page";
import { terms } from "./content";

export const metadata: Metadata = {
  title: "Términos y condiciones / Terms and conditions",
  description: "Las reglas para usar Fitty.",
};

export default function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  return <LegalPage documents={terms} searchParams={searchParams} />;
}
