import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedText } from "@/components/localized-text";
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[720px] space-y-4 p-6"
      role="status"
    >
      <Skeleton className="h-12 w-1/2" />
      <Skeleton className="h-56 w-full" />
      <span className="sr-only">
        <LocalizedText es="Cargando…" en="Loading…" />
      </span>
    </div>
  );
}
