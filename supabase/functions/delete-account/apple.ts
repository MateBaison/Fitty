// Revokes "Sign in with Apple" access when an account is deleted (Apple TN3194).
// No imports, so the web unit tests can load it too.
export type AppleConfig = { clientId: string; clientSecret: string };
type Identity = {
  provider?: string;
  id?: string;
  identity_data?: Record<string, unknown> | null;
};
type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

const apple = "https://appleid.apple.com/auth";
const form = (fields: Record<string, string>): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(fields).toString(),
  signal: AbortSignal.timeout(8000),
});

/** The Apple user linked to the account, or null when it never used Apple. */
export function appleSubject(identities: Identity[] | null | undefined) {
  const identity = identities?.find((item) => item.provider === "apple");
  const subject = identity?.identity_data?.sub ?? identity?.id;
  return typeof subject === "string" ? subject : null;
}

function tokenSubject(idToken: unknown) {
  if (typeof idToken !== "string") return null;
  try {
    // Received straight from Apple over TLS, so the signature is not rechecked.
    const part = idToken.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).sub as unknown;
  } catch {
    return null;
  }
}

/**
 * Exchanges the one-time code from the app for a refresh token. Returns null on
 * any failure: Apple being unavailable must never stop an account deletion.
 */
export async function appleRefreshToken(
  config: AppleConfig,
  code: unknown,
  subject: string,
  fetcher: Fetcher = fetch,
) {
  if (typeof code !== "string" || !code || code.length > 2048) return null;
  try {
    const response = await fetcher(
      `${apple}/token`,
      form({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    );
    if (!response.ok) {
      console.warn("apple: code exchange failed", response.status);
      return null;
    }
    const body = await response.json();
    // A code from a different Apple ID must not be revoked for this account.
    if (tokenSubject(body.id_token) !== subject) return null;
    return typeof body.refresh_token === "string" ? body.refresh_token : null;
  } catch {
    console.warn("apple: code exchange unavailable");
    return null;
  }
}

export async function revokeAppleToken(
  config: AppleConfig,
  token: string,
  fetcher: Fetcher = fetch,
) {
  try {
    const response = await fetcher(
      `${apple}/revoke`,
      form({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        token,
        token_type_hint: "refresh_token",
      }),
    );
    if (!response.ok) console.warn("apple: revoke failed", response.status);
    return response.ok;
  } catch {
    console.warn("apple: revoke unavailable");
    return false;
  }
}
