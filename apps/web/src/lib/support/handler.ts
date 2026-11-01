import { createHash } from "node:crypto";
import { z } from "zod";
import {
  MAX_SUPPORT_BODY,
  MAX_SUPPORT_BYTES,
  safeAttachmentName,
  supportCategories,
  supportInputSchema,
  validSupportFile,
} from "./validation";

type User = { id: string; email?: string };
export type SupportEmail = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  attachments: { filename: string; content: string }[];
};
const headers = { "Cache-Control": "private, no-store" };
const reply = (code: string, status: number, extra?: Record<string, string>) =>
  Response.json({ error: code }, { status, headers: { ...headers, ...extra } });
/** Best-effort burst guard per running instance; provider quotas remain the global ceiling. */
export class SupportBurstGuard {
  private entries = new Map<
    string,
    { time: number; id: string; hash: string }[]
  >();
  allow(user: string, id: string, hash: string, now = Date.now()) {
    for (const [key, entries] of this.entries) {
      const recent = entries.filter((item) => now - item.time < 10 * 60_000);
      if (recent.length) this.entries.set(key, recent);
      else this.entries.delete(key);
    }
    const recent = this.entries.get(user) ?? [];
    const duplicate = recent.find((item) => item.id === id);
    if (duplicate) return duplicate.hash === hash;
    if (
      recent.length >= 3 ||
      (!this.entries.has(user) && this.entries.size >= 5000)
    )
      return false;
    this.entries.set(user, [...recent, { time: now, id, hash }]);
    return true;
  }
}
export async function handleSupportPost(
  request: Request,
  dependencies: {
    originAllowed: (origin: string | null) => boolean;
    user: () => Promise<User | null>;
    configured: () => boolean;
    guard: SupportBurstGuard;
    send: (email: SupportEmail, idempotency: string) => Promise<{ id: string }>;
  },
) {
  if (!dependencies.originAllowed(request.headers.get("origin")))
    return reply("origin", 403);
  let user: User | null;
  try {
    user = await dependencies.user();
  } catch {
    return reply("unavailable", 503);
  }
  if (!user || !z.email().safeParse(user.email).success)
    return reply("unauthorized", 401);
  if (!dependencies.configured()) {
    console.error("[support] RESEND_API_KEY is missing or malformed");
    return reply("unavailable", 503);
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data;") || !request.body)
    return reply("invalid", 400);
  if (Number(request.headers.get("content-length")) > MAX_SUPPORT_BODY)
    return reply("size", 413);
  let form: FormData;
  try {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SUPPORT_BODY) {
        await reader.cancel();
        return reply("size", 413);
      }
      chunks.push(value);
    }
    form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    return reply("invalid", 400);
  }
  const allowed = new Set([
    "requestId",
    "category",
    "subject",
    "message",
    "files",
  ]);
  if ([...form.keys()].some((key) => !allowed.has(key)))
    return reply("invalid", 400);
  for (const key of ["requestId", "category", "subject", "message"])
    if (form.getAll(key).length !== 1) return reply("invalid", 400);
  const parsed = supportInputSchema.safeParse(
    Object.fromEntries(
      ["requestId", "category", "subject", "message"].map((key) => [
        key,
        form.get(key),
      ]),
    ),
  );
  if (!parsed.success) return reply("invalid", 400);
  const files = form.getAll("files");
  if (files.length > 5 || files.some((file) => typeof file === "string"))
    return reply("invalid", 400);
  const attachments = files as File[];
  if (attachments.reduce((sum, file) => sum + file.size, 0) > MAX_SUPPORT_BYTES)
    return reply("size", 413);
  if (attachments.some((file) => !validSupportFile(file)))
    return reply("file", 400);
  const data = parsed.data;
  const email: SupportEmail = {
    from: "Fitty Soporte <soporte@fitty.uy>",
    to: ["soporte@fitty.uy"],
    reply_to: user.email!,
    subject: `[Fitty · ${supportCategories[data.category]}] ${data.subject}`,
    text: `Consulta enviada desde Fitty\nTipo: ${supportCategories[data.category]}\nResponder a: ${user.email!}\nReferencia: ${data.requestId}\n\n${data.message}`,
    attachments: await Promise.all(
      attachments.map(async (file) => ({
        filename: safeAttachmentName(file.name),
        content: Buffer.from(await file.arrayBuffer()).toString("base64"),
      })),
    ),
  };
  const hash = createHash("sha256").update(JSON.stringify(email)).digest("hex");
  if (!dependencies.guard.allow(user.id, data.requestId, hash))
    return reply("rate", 429, { "Retry-After": "600" });
  try {
    const result = await dependencies.send(
      email,
      `fitty-support/${user.id}/${data.requestId}`,
    );
    return Response.json(
      { ok: true, reference: data.requestId, id: result.id },
      { headers },
    );
  } catch (error) {
    console.error(
      "[support] send failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return reply("send", 502);
  }
}
