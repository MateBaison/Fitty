import { createApiClient } from "@fitty/core/api/v1";
import { env } from "./env";
import { supabase } from "./supabase";

export const api = createApiClient({
  baseUrl: env.apiUrl,
  accessToken: async () =>
    (await supabase.auth.getSession()).data.session?.access_token ?? null,
});
