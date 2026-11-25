import { describe, expect, test, vi } from "vitest";
import {
  appleRefreshToken,
  appleSubject,
  revokeAppleToken,
} from "../../../../supabase/functions/delete-account/apple";

const config = { clientId: "uy.fitty.app", clientSecret: "secret" };
const idToken = (sub: string) =>
  `header.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.sig`;
const answer = (body: unknown, status = 200) =>
  vi.fn(async (_url: string, _init: RequestInit) =>
    Response.json(body, { status }),
  );

describe("Sign in with Apple revocation", () => {
  test("finds the Apple user only on accounts that used Apple", () => {
    expect(appleSubject([{ provider: "google", id: "g" }])).toBeNull();
    expect(appleSubject(undefined)).toBeNull();
    expect(
      appleSubject([{ provider: "apple", identity_data: { sub: "a1" } }]),
    ).toBe("a1");
  });

  test("exchanges the code of the same Apple user for a refresh token", async () => {
    const fetcher = answer({ refresh_token: "r1", id_token: idToken("a1") });
    expect(await appleRefreshToken(config, "code", "a1", fetcher)).toBe("r1");
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://appleid.apple.com/auth/token");
    const sent = new URLSearchParams(String(init.body));
    expect(sent.get("grant_type")).toBe("authorization_code");
    expect(sent.get("client_id")).toBe("uy.fitty.app");
    expect(sent.get("code")).toBe("code");
  });

  test("ignores another Apple ID, bad input and Apple failures", async () => {
    const other = answer({ refresh_token: "r1", id_token: idToken("other") });
    expect(await appleRefreshToken(config, "code", "a1", other)).toBeNull();
    const unused = answer({});
    expect(await appleRefreshToken(config, 5, "a1", unused)).toBeNull();
    expect(
      await appleRefreshToken(config, "x".repeat(2049), "a1", unused),
    ).toBeNull();
    expect(unused).not.toHaveBeenCalled();
    const rejected = answer({ error: "invalid_grant" }, 400);
    expect(await appleRefreshToken(config, "code", "a1", rejected)).toBeNull();
    const offline = vi.fn(async () => Promise.reject(new Error("offline")));
    expect(await appleRefreshToken(config, "code", "a1", offline)).toBeNull();
    expect(await revokeAppleToken(config, "r1", offline)).toBe(false);
  });

  test("revokes the refresh token", async () => {
    const fetcher = vi.fn(
      async (_url: string, _init: RequestInit) => new Response(null),
    );
    expect(await revokeAppleToken(config, "r1", fetcher)).toBe(true);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://appleid.apple.com/auth/revoke");
    const sent = new URLSearchParams(String(init.body));
    expect(sent.get("token")).toBe("r1");
    expect(sent.get("token_type_hint")).toBe("refresh_token");
  });
});
