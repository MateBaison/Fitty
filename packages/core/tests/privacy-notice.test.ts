import { expect, test } from "vitest";
import { languages, privacyNotice } from "../src/data/translations";

test("the privacy notice isolates the policy name in every language", () => {
  for (const language of languages) {
    const { before, link, after } = privacyNotice(language);
    expect(link, language).not.toBe("");
    expect(before + link + after).toContain(link);
    expect(before.length + after.length).toBeGreaterThan(0);
  }
  expect(privacyNotice("es")).toEqual({
    before: "Al continuar aceptás la ",
    link: "Política de privacidad",
    after: ".",
  });
});
