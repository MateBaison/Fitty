import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("rest timer sounds at start and completes once", async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await page.addInitScript(() => {
    let soundCount = 0;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (when?: number) => {
        document.documentElement.dataset.soundCount = String(++soundCount);
        start(when);
      };
      return oscillator;
    };
  });
  await login(page);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Rutina principal · Pecho y tríceps/ })
    .click();
  await page.getByRole("switch", { name: "Descanso entre series" }).check();
  await page.getByLabel("Segundos", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "Iniciar descanso 1 serie 1", exact: true })
    .click();
  await expect
    .poll(() => page.locator("html").getAttribute("data-sound-count"))
    .toBe("2");
  await expect
    .poll(() => page.locator("html").getAttribute("data-sound-count"), {
      timeout: 8000,
    })
    .toBe("5");
  await page.waitForTimeout(400);
  await expect(page.locator("html")).toHaveAttribute("data-sound-count", "5");
});
