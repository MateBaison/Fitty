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
    .getByRole("button", { name: /Pecho y tríceps/ })
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
  const summary = page.locator(".progress-dashboard");
  await expect(summary.locator(".progress-stats > article")).toHaveCount(3);
  await expect(summary.locator(".progress-stats")).toContainText(
    "Entrenamientos1",
  );
  await page
    .getByText("Ver detalle del entrenamiento", { exact: true })
    .click();
  await expect(summary).toContainText("400 kg");
  await page
    .getByRole("combobox", { name: "Período", exact: true })
    .selectOption("all");
  await expect(
    page.getByRole("region", { name: "Resumen", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Fecha de referencia", { exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("combobox", { name: "Período", exact: true })
    .selectOption("week");
  await expect(
    page.getByRole("region", { name: "Resumen", exact: true }),
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
