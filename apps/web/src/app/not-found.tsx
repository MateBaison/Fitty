import Link from "next/link";
import { LocalizedText } from "@/components/localized-text";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-[720px] space-y-4 p-6">
      <h1 className="text-2xl font-bold">
        <LocalizedText
          es="No encontramos esta página"
          en="We could not find this page"
        />
      </h1>
      <Link href="/home" className="text-primary underline">
        <LocalizedText es="Volver al inicio" en="Back to home" />
      </Link>
    </main>
  );
}
