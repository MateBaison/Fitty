import { expect, test } from "bun:test";
import { trustedOrigin, safeNext } from "../../src/lib/env";
test("production accepts only the exact configured Fitty origin", () => {
  for (const site of ["https://fitty.uy"]) {
    expect(trustedOrigin("https://fitty.uy", site)).toBe(true);
    for (const origin of [
      "https://hercules-navy.vercel.app",
      null,
      "http://fitty.uy",
      "https://fitty.uy.evil.example",
      "https://www.fitty.uy",
      "https://evil.example",
      "https://fitty.uy/",
    ])
      expect(trustedOrigin(origin, site)).toBe(false);
  }
  expect(trustedOrigin("https://fitty.uy", "http://localhost:3000")).toBe(
    false,
  );
  expect(trustedOrigin("http://localhost:3000", "http://localhost:3000")).toBe(
    true,
  );
  expect(safeNext("https://fitty.uy/home")).toBe("/home");
});
