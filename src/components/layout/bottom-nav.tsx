"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/state/app-provider";
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
  return (
    <nav
      className="bottom-nav"
      aria-label={t("Navegación principal", "Main navigation")}
    >
      {destinations.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            pathname === href ||
            (href === "/home" &&
              ["/workout", "/library", "/progress"].includes(pathname))
              ? "page"
              : undefined
          }
        >
          <Icon size={21} aria-hidden="true" />
          <span>{t(label, label)}</span>
        </Link>
      ))}
    </nav>
  );
}
