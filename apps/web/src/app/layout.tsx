import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthEntry } from "@/features/auth/auth-entry";
import { LaunchSplash } from "@/components/layout/launch-splash";

export const metadata: Metadata = {
  title: { default: "FITTY · Entrenamiento", template: "%s · FITTY" },
  description: "Tu entrenamiento, tus rutinas y tu progreso.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FITTY",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: {
      url: "/assets/brand/fitty-isotype-32.png",
      sizes: "32x32",
      type: "image/png",
    },
    apple: {
      url: "/assets/brand/fitty-lockup-180.png",
      sizes: "180x180",
      type: "image/png",
    },
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
        <LaunchSplash />
        <AuthEntry />
        {children}
      </body>
    </html>
  );
}
