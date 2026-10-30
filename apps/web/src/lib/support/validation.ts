import { z } from "zod";
export const MAX_SUPPORT_BYTES = 3 * 1024 * 1024;
export const MAX_SUPPORT_BODY = MAX_SUPPORT_BYTES + 128 * 1024;
export const supportInputSchema = z.strictObject({
  requestId: z.uuid(),
  category: z.enum([
    "account",
    "technical",
    "exercises",
    "suggestion",
    "privacy",
    "other",
  ]),
  subject: z
    .string()
    .max(150)
    .refine((value) => !/[\r\n\u0000-\u001f\u007f]/.test(value))
    .transform((value) => value.trim())
    .pipe(z.string().min(1)),
  message: z.string().trim().min(1).max(5000),
});
const extensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "heic",
  "heif",
  "pdf",
  "txt",
  "mp4",
  "webm",
  "mov",
]);
export function validSupportFile(file: Pick<File, "name" | "size">) {
  return (
    file.size > 0 &&
    file.size <= MAX_SUPPORT_BYTES &&
    extensions.has(file.name.split(".").at(-1)?.toLowerCase() ?? "")
  );
}
export function safeAttachmentName(name: string) {
  return (
    name.replace(/[\\/\r\n\u0000-\u001f\u007f]/g, "_").slice(-120) || "adjunto"
  );
}
export const supportCategories = {
  account: "Cuenta y acceso",
  technical: "Problema técnico",
  exercises: "Ejercicios y rutinas",
  suggestion: "Sugerencia",
  privacy: "Privacidad y datos",
  other: "Otra consulta",
};
