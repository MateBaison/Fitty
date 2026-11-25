import type { Metadata } from "next";
import { LegalPage } from "../legal-page";
import { support } from "./content";

export const metadata: Metadata = {
  title: "Soporte / Support",
  description:
    "Cómo contactar al soporte de Fitty y resolver problemas comunes.",
};

export default function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  return (
    <LegalPage documents={support} searchParams={searchParams} contactOnTop />
  );
}
