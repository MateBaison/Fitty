import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthEntry } from "@/features/auth/auth-entry";

export const metadata: Metadata = {
  title: { default: "FITTY · Entrenamiento", template: "%s · FITTY" },
  description: "Tu entrenamiento, tus rutinas y tu progreso.",
  icons: {
    icon: "/assets/fitty-logo.png",
    apple: "/assets/fitty-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#090b10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body>
        <AuthEntry />
        {children}
      </body>
    </html>
  );
}
