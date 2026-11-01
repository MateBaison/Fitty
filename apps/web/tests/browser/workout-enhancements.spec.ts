import { expect, test } from "@playwright/test";
import { login, openHomeSection } from "./login-helper";
test("compact workout controls, grouped drops, remembered metric and record source", async ({
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
  await expect(page).toHaveURL(/\/workout$/);
  const first = page.locator('[data-workout-entry="0"]');
  await first
    .getByRole("switch", { name: "Registrar por tiempo", exact: true })
    .check();
  await expect(
    page.getByLabel("Segundos 1 serie 1", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Segundos 1 serie 1", { exact: true }),
  ).toBeVisible();
  await first
    .getByRole("switch", { name: "Registrar por tiempo", exact: true })
    .uncheck();
  const replace = await first
    .getByRole("button", { name: "Reemplazar ejercicio" })
    .boundingBox();
  const tracking = await first.locator(".metric-switch-control").boundingBox();
  expect(Math.abs(replace!.y - tracking!.y)).toBeLessThan(2);
  await page.getByRole("switch", { name: "Descanso entre series" }).check();
  await page
    .getByRole("button", { name: "Iniciar descanso 1 serie 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Iniciar descanso 1 serie 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Tipo de serie 1 serie 1", exact: true })
    .click();
  await page.getByRole("button", { name: /Descendente/ }).click();
  await page.getByLabel("Peso 1 serie 1", { exact: true }).fill("40");
  await page.getByLabel("Repeticiones 1 serie 1", { exact: true }).fill("10");
  await first.getByRole("button", { name: "Bajar peso", exact: true }).click();
  await expect(page.getByLabel("Peso 1 serie 2", { exact: true })).toHaveValue(
    "32",
  );
  await expect(first.locator(".drop-segment-controls")).toContainText(
    "Reducción sugerida",
  );
  await first
    .locator(".drop-segment-controls")
    .getByRole("button", { name: "− Eliminar última serie", exact: true })
    .click();
  await expect(page.getByLabel("Peso 1 serie 2", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Peso 1 serie 1", { exact: true })).toHaveValue(
    "40",
  );
  await first.getByRole("button", { name: "Bajar peso", exact: true }).click();
  await page.getByLabel("Repeticiones 1 serie 2", { exact: true }).fill("8");
  await expect(
    page.getByRole("button", {
      name: "Iniciar descanso 1 serie 1",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Iniciar descanso 1 serie 2",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/compact-workout-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Finalizar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar entrenamiento", exact: true })
    .click();
  await expect(page).toHaveURL(/\/home$/);
  await page
    .locator(
      `[data-calendar-date="${await page.evaluate(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })}"]`,
    )
    .click();
  const dialogBounds = await page.getByRole("dialog").boundingBox();
  expect(dialogBounds!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  const summary = page.locator(".calendar-session-summary");
  await expect(summary).toContainText("Pecho y tríceps");
  await expect(summary).toContainText("Rutina principal");
  await expect(summary).toContainText("Tiempo:");
  await expect(summary).toContainText("Volumen: 656");
  const coords = await summary
    .locator("strong,span")
    .evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
    );
  expect(Math.max(...coords) - Math.min(...coords)).toBeLessThan(8);
  const labelBounds = await summary.locator("strong").boundingBox();
  const summaryBounds = await summary.boundingBox();
  expect(labelBounds!.x).toBeGreaterThanOrEqual(summaryBounds!.x);
  await summary.click();
  await expect(
    page.locator(".calendar-workout .set-type-letter").first(),
  ).toHaveText("D");
  await page.screenshot({
    path: `artifacts/calendar-inline-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page
    .getByRole("button", { name: "Tipo de serie 1 serie 1", exact: true })
    .click();
  await page.getByRole("button", { name: /Fallo/ }).click();
  await expect(page.getByLabel("Peso 1 serie 1", { exact: true })).toHaveValue(
    "40",
  );
  await page
    .getByRole("button", { name: "Guardar entrenamiento", exact: true })
    .click();
  await expect(
    page.locator(".calendar-workout .set-type-letter").first(),
  ).toHaveText("F");
  await expect(page.locator(".calendar-session-summary")).toContainText(
    "Tiempo: 0 min",
  );
  await page.keyboard.press("Escape");
  await openHomeSection(page, "Progreso");
  await page.getByRole("button", { name: "Ejercicios", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Récords personales" }),
  ).toBeVisible();
  await page.locator(".progress-records button").first().click();
  await expect(page.getByRole("dialog")).toContainText("Pecho y tríceps");
});

test("pyramid help and numbered ascending and descending segments", async ({
  page,
}) => {
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
  const first = page.locator('[data-workout-entry="0"]');
  await page
    .getByRole("button", { name: "Tipo de serie 1 serie 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ayuda sobre tipos de serie" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "20 → 25 → 30 → 25 → 20 kg",
  );
  await page.getByRole("button", { name: /Piramidal/ }).click();
  await page.getByLabel("Peso 1 serie 1", { exact: true }).fill("20");
  await first.getByRole("button", { name: "Subir peso", exact: true }).click();
  await expect(page.getByLabel("Peso 1 serie 2", { exact: true })).toHaveValue(
    "24",
  );
  await first.getByRole("button", { name: "Bajar peso", exact: true }).click();
  await expect(page.getByLabel("Peso 1 serie 3", { exact: true })).toHaveValue(
    "19.2",
  );
  await expect(first.locator(".set-number").nth(0)).toHaveText("1.1");
  await expect(first.locator(".set-number").nth(1)).toHaveText("1.2");
  await expect(first.locator(".set-number").nth(2)).toHaveText("1.3");
  await expect(
    first.locator('[data-set-row="2"] .set-type-control'),
  ).toHaveText("P");
});
