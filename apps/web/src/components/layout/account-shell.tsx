"use client";
import { usePathname, useRouter } from "next/navigation";
import { useSwipeNavigation } from "@/lib/browser/use-swipe-navigation";
import { ClockProvider } from "@/features/clocks/clock-provider";
import { BottomNav } from "./bottom-nav";
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const swipe = useSwipeNavigation((direction) => {
    if (pathname === "/workout") return false;
    const destinations = ["/professionals", "/home", "/tools", "/profile"];
    if (
      ["/library", "/progress"].includes(pathname) &&
      direction === "previous"
    ) {
      router.push("/home");
      return true;
    }
    const index = destinations.indexOf(
      pathname === "/library" || pathname === "/progress" ? "/home" : pathname,
    );
    const next = destinations[index + (direction === "next" ? 1 : -1)];
    if (index < 0 || !next) return false;
    router.push(next);
    return true;
  });
  return (
    <ClockProvider>
      <main
        id="main-content"
        tabIndex={-1}
        {...swipe}
        className="swipe-navigation"
      >
        {children}
      </main>
      <BottomNav />
    </ClockProvider>
  );
}
