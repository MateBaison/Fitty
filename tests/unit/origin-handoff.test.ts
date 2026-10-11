import { expect, test } from "bun:test";
import { trustedOrigin, safeNext } from "../../src/lib/env";
test("production domain handoff accepts only the two explicitly owned HTTPS origins", () => {
  for (const site of ["https://fitty.uy", "https://hercules-navy.vercel.app"]) {
    expect(trustedOrigin("https://fitty.uy", site)).toBe(true);
    expect(trustedOrigin("https://hercules-navy.vercel.app", site)).toBe(true);
    for (const origin of [
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
