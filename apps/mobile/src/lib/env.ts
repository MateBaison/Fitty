import { z } from "zod";

// Only public values are bundled into the app.
export const env = z
  .object({
    supabaseUrl: z.url(),
    supabaseKey: z
      .string()
      .min(20)
      .refine(
        (key) => !key.startsWith("sb_secret_"),
        "Never bundle a secret key",
      ),
    apiUrl: z.url(),
  })
  .parse({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://fitty.uy",
  });
