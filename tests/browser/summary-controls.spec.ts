import { expect, test } from "@playwright/test";
import { login, openHomeSection } from "./login-helper";
test("metric switch keeps recorded values, weekly summary has volume, routine goal, lifetime and daily details", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Rutina principal · Pecho y tríceps/ })
    .click();
  const entry = page.locator('[data-workout-entry="0"]');
  await page.getByLabel("Peso 1 serie 1", { exact: true }).fill("40");
  await page.getByLabel("Repeticiones 1 serie 1", { exact: true }).fill("10");
  const metric = entry.getByRole("switch", {
    name: "Registrar por tiempo",
    exact: true,
  });
  await metric.check();
  await page.getByLabel("Segundos 1 serie 1", { exact: true }).fill("30");
  await metric.uncheck();
  await expect(
    page.getByLabel("Repeticiones 1 serie 1", { exact: true }),
  ).toHaveValue("10");
  await expect(page.getByLabel("Peso 1 serie 1", { exact: true })).toHaveValue(
    "40",
  );
  await metric.check();
  await expect(
    page.getByLabel("Segundos 1 serie 1", { exact: true }),
  ).toHaveValue("30");
  await metric.uncheck();
  await page
    .getByRole("button", { name: "Finalizar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar entrenamiento", exact: true })
    .click();
  await openHomeSection(page, "Progreso");
  const summary = page.locator(".weekly-summary");
  await expect(summary.locator(".metric-grid > div")).toHaveCount(4);
  await expect(summary.locator(".metric-grid")).toContainText("1/3");
  await expect(summary.locator(".metric-grid")).toContainText("400 kg");
  const weekday = await page.evaluate(() => (new Date().getDay() + 6) % 7);
  await summary.locator(".weekly-duration-day").nth(weekday).click();
  await expect(page.getByRole("dialog")).toContainText("Pecho y tríceps");
  await expect(page.getByRole("dialog")).toContainText("400 kg");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Siempre", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen total", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Elegir semana", { exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Semana actual", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resumen semanal", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/weekly-controls-${info.project.name}.png`,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
