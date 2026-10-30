import { expect, test } from "vitest";
import { apiStateRepository, createApiClient, ApiError } from "../src/api/v1";
import { createDefaultSnapshot } from "../src/domain/legacy/read-snapshot";
import { RemoteStateChanged } from "../src/sync/state-repository";

function fakeFetch(
  handler: (url: string, init: RequestInit) => [number, unknown],
) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (
    input: URL | RequestInfo,
    init: RequestInit = {},
  ) => {
    const url = String(input);
    calls.push({ url, init });
    const [status, body] = handler(url, init);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

test("API client sends the bearer token and validates responses", async () => {
  const { calls, fetchImpl } = fakeFetch(() => [
    200,
    { payload: { profile: {} }, updatedAt: "2026-10-30T18:00:00.123456+00:00" },
  ]);
  const client = createApiClient({
    baseUrl: "https://fitty.uy",
    accessToken: async () => "a".repeat(40),
    fetch: fetchImpl,
  });
  await expect(client.getState()).resolves.toMatchObject({
    updatedAt: "2026-10-30T18:00:00.123456+00:00",
  });
  expect(calls[0]?.url).toBe("https://fitty.uy/api/v1/state");
  expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe(
    `Bearer ${"a".repeat(40)}`,
  );
});

test("API client refuses to call without a session and surfaces typed errors", async () => {
  const { calls, fetchImpl } = fakeFetch(() => [
    401,
    { error: "Iniciá sesión de nuevo.", code: "unauthorized" },
  ]);
  const signedOut = createApiClient({
    baseUrl: "https://fitty.uy",
    accessToken: async () => null,
    fetch: fetchImpl,
  });
  await expect(signedOut.getState()).rejects.toBeInstanceOf(ApiError);
  expect(calls).toHaveLength(0);
  const expired = createApiClient({
    baseUrl: "https://fitty.uy",
    accessToken: async () => "b".repeat(40),
    fetch: fetchImpl,
  });
  await expect(expired.getState()).rejects.toMatchObject({
    code: "unauthorized",
    status: 401,
  });
});

test("API repository saves against the last read revision and maps conflicts", async () => {
  let stored = "2026-10-30T18:00:00.000Z";
  const { calls, fetchImpl } = fakeFetch((url, init) => {
    if (init.method !== "PUT")
      return [200, { payload: null, updatedAt: stored }];
    const body = JSON.parse(String(init.body)) as { baseUpdatedAt: string };
    if (body.baseUpdatedAt !== stored)
      return [
        409,
        { error: "Otro dispositivo modificó la cuenta.", code: "conflict" },
      ];
    stored = "2026-10-30T18:00:01.000Z";
    return [200, { updatedAt: stored }];
  });
  const repo = apiStateRepository(
    createApiClient({
      baseUrl: "https://fitty.uy",
      accessToken: async () => "c".repeat(40),
      fetch: fetchImpl,
    }),
  );
  const signal = new AbortController().signal;
  await expect(repo.save(createDefaultSnapshot(), signal)).rejects.toThrow();
  await repo.load(signal);
  await repo.save(createDefaultSnapshot(), signal);
  expect(calls.at(-1)?.init.method).toBe("PUT");
  await expect(repo.changed?.(signal)).resolves.toBe(false);
  stored = "2026-10-30T18:00:05.000Z";
  await expect(
    repo.save(createDefaultSnapshot(), signal),
  ).rejects.toBeInstanceOf(RemoteStateChanged);
});
