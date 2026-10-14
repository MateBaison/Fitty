import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FITTY",
    short_name: "FITTY",
    description: "Tu entrenamiento, tus rutinas y tu progreso.",
    lang: "es",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#052e4f",
    theme_color: "#052e4f",
    icons: [
      {
        src: "/assets/brand/fitty-isotype-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/fitty-isotype-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/fitty-isotype-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
