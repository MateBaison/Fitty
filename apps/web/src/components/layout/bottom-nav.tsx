"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/state/app-provider";
import { RestDrawer } from "@/features/workouts/rest-drawer";
import { WorkoutDrawer } from "@/features/workouts/workout-drawer";
import { House, Timer, UserRound, UsersRound } from "lucide-react";
const destinations = [
  { href: "/professionals", label: "Profesionales", icon: UsersRound },
  { href: "/home", label: "Inicio", icon: House },
  { href: "/tools", label: "Herramientas", icon: Timer },
  { href: "/profile", label: "Perfil", icon: UserRound },
] as const;
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useApp();
  const active = destinations.findIndex(
    ({ href }) =>
      pathname === href ||
      (href === "/home" &&
        ["/workout", "/library", "/progress"].includes(pathname)),
  );
  return (
    <>
      <RestDrawer />
      <WorkoutDrawer />
      <nav
        className="bottom-nav"
        aria-label={t("Navegación principal", "Main navigation")}
      >
        {active >= 0 && (
          // One highlight for the whole bar, so it can slide between sections.
          <span
            className="bottom-nav-indicator"
            aria-hidden="true"
            style={{ "--active": active } as React.CSSProperties}
          />
        )}
        {destinations.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            aria-current={index === active ? "page" : undefined}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{t(label, label)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
