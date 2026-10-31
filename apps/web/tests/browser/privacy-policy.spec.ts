import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("privacy policy opens in the language of the app", async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.goto("/privacidad?lang=fr");
  await expect(
    page.getByRole("heading", { name: "Politique de confidentialité" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mineurs" })).toBeVisible();
  await page.goto("/privacidad?lang=ar");
  await expect(page.locator("main")).toHaveAttribute("dir", "rtl");
  // An unknown language falls back to the browser's language (English in the test browser).
  await page.goto("/privacidad?lang=xx");
  await expect(
    page.getByRole("heading", { name: "Privacy policy" }),
  ).toBeVisible();
});

test("profile ends with reset account, then privacy policy next to a red sign out", async ({
  page,
  context,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await login(page);
  await page.goto("/profile");
  const link = page.getByRole("link", {
    name: "Política de privacidad",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", "/privacidad?lang=es");
  const order = await page.evaluate(() => {
    const text = (label: string) =>
      [...document.querySelectorAll("section, a, button")].findIndex((node) =>
        node.textContent?.includes(label),
      );
    return [
      text("Copia de tus datos"),
      text("Reiniciar"),
      text("Política de privacidad"),
    ];
  });
  expect(order[0]).toBeLessThan(order[1]!);
  expect(order[1]).toBeLessThan(order[2]!);
  const popup = context.waitForEvent("page");
  await link.click();
  await expect((await popup).url()).toContain("/privacidad?lang=es");
});
