import { z } from "zod";

export const requiredProfileFields = [
  "name",
  "birth",
  "country",
  "height",
  "weight",
  "gender",
] as const;
export type RequiredProfileField = (typeof requiredProfileFields)[number];
export function missingProfileFields(
  profile: Record<string, unknown>,
  today: string,
): RequiredProfileField[] {
  return requiredProfileFields.filter((field) => {
    const value = profile[field];
    if (field === "height" || field === "weight")
      return (
        (typeof value !== "number" && typeof value !== "string") ||
        !String(value).trim() ||
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
      );
    if (field === "birth")
      return !z.iso.date().safeParse(value).success || String(value) > today;
    return (
      typeof value !== "string" ||
      !value.trim() ||
      (field === "name" && value.trim().length > 80)
    );
  });
}
