import { expect, test } from "vitest";
import {
  handleSupportPost,
  SupportBurstGuard,
  type SupportEmail,
} from "../../src/lib/support/handler";
import { MAX_SUPPORT_BYTES } from "../../src/lib/support/validation";
function request(
  overrides: Record<string, string> = {},
  file?: File,
  origin = "https://fitty.uy",
) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    requestId: crypto.randomUUID(),
    category: "suggestion",
    subject: "Una idea",
    message: "Mi sugerencia",
    ...overrides,
  }))
    form.set(key, value);
  if (file) form.append("files", file);
  return new Request("https://fitty.uy/api/support", {
    method: "POST",
    headers: { origin },
    body: form,
  });
}
function dependencies() {
  const calls: { email: SupportEmail; idempotency: string }[] = [];
  return {
    calls,
    originAllowed: (origin: string | null) => origin === "https://fitty.uy",
    user: async () => ({ id: "user-1", email: "person@example.invalid" }),
    configured: () => true,
    guard: new SupportBurstGuard(),
    send: async (email: SupportEmail, idempotency: string) => {
      calls.push({ email, idempotency });
      return { id: "provider-id" };
    },
  };
}
test("support destination and reply-to are server controlled; attachments are forwarded without profile data", async () => {
  const deps = dependencies();
  const file = new File(["test attachment"], "note.txt", {
    type: "text/plain",
  });
  const response = await handleSupportPost(request({}, file), deps);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(deps.calls[0]?.email.to).toEqual(["soporte@fitty.uy"]);
  expect(deps.calls[0]?.email.reply_to).toBe("person@example.invalid");
  expect(deps.calls[0]?.email.attachments[0]?.content).toBe(
    Buffer.from("test attachment").toString("base64"),
  );
  expect(deps.calls[0]?.idempotency).toMatch(/^fitty-support\/user-1\//);
  expect(
    (await handleSupportPost(request({ to: "victim@example.invalid" }), deps))
      .status,
  ).toBe(400);
});
test("support rejects anonymous, cross-origin and malformed requests before sending", async () => {
  const deps = dependencies();
  expect(
    (
      await handleSupportPost(
        request({}, undefined, "https://evil.invalid"),
        deps,
      )
    ).status,
  ).toBe(403);
  expect(
    (await handleSupportPost(request(), { ...deps, user: async () => null }))
      .status,
  ).toBe(401);
  expect(
    (await handleSupportPost(request(), { ...deps, configured: () => false }))
      .status,
  ).toBe(503);
  const invalidCases: Record<string, string>[] = [
    { subject: "\r\nBcc: someone" },
    { message: " " },
    { category: "bad" },
    { requestId: "bad" },
  ];
  for (const invalid of invalidCases)
    expect((await handleSupportPost(request(invalid), deps)).status).toBe(400);
  expect(deps.calls).toHaveLength(0);
});
test("attachment and total body limits are enforced on the server", async () => {
  const deps = dependencies();
  expect(
    (await handleSupportPost(request({}, new File(["bad"], "app.exe")), deps))
      .status,
  ).toBe(400);
  expect(
    (
      await handleSupportPost(
        request(
          {},
          new File([new Uint8Array(MAX_SUPPORT_BYTES + 1)], "large.txt"),
        ),
        deps,
      )
    ).status,
  ).toBe(413);
  const huge = new Request("https://fitty.uy/api/support", {
    method: "POST",
    headers: {
      origin: "https://fitty.uy",
      "content-type": "multipart/form-data; boundary=a",
      "content-length": "9000000",
    },
    body: "x",
  });
  expect((await handleSupportPost(huge, deps)).status).toBe(413);
  expect(deps.calls).toHaveLength(0);
});
test("failures never claim success and identical retries keep the same idempotency key", async () => {
  const deps = dependencies();
  const requestId = crypto.randomUUID();
  const failed = await handleSupportPost(request({ requestId }), {
    ...deps,
    send: async () => {
      throw new Error("upstream timeout");
    },
  });
  expect(failed.status).toBe(502);
  expect(await failed.json()).toEqual({ error: "send" });
  expect((await handleSupportPost(request({ requestId }), deps)).status).toBe(
    200,
  );
  expect(deps.calls[0]?.idempotency).toBe(`fitty-support/user-1/${requestId}`);
});
test("burst guard limits new attempts while allowing unchanged retries and isolates accounts", () => {
  const guard = new SupportBurstGuard();
  for (let i = 0; i < 3; i++)
    expect(guard.allow("a", String(i), "same", 1000)).toBe(true);
  expect(guard.allow("a", "0", "same", 1001)).toBe(true);
  expect(guard.allow("a", "0", "different", 1001)).toBe(false);
  expect(guard.allow("a", "4", "same", 1001)).toBe(false);
  expect(guard.allow("b", "4", "same", 1001)).toBe(true);
  expect(guard.allow("a", "4", "same", 601001)).toBe(true);
});
