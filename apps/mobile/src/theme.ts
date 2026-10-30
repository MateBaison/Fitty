// Mirrors the web app's dark theme tokens (apps/web/src/app/globals.css).
export const colors = {
  background: "#090b10",
  foreground: "#f5f7fb",
  card: "#12151c",
  secondary: "#191d26",
  muted: "#99a1b2",
  border: "#272d39",
  primary: "#69b9e7",
  primaryForeground: "#082b43",
  accent: "#8ed2f5",
  success: "#4ade80",
  warning: "#facc15",
  destructive: "#dc2626",
} as const;
export const radius = 20;
export const space = (n: number) => n * 4;
