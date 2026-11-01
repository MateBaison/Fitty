import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test("add an extra exercise to an active routine workout and retain it after reload", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await login(page);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Pecho y tríceps/ })
    .click();
  await expect(page).toHaveURL(/\/workout$/);
  const before = await page.locator("[data-workout-entry]").count();
  await expect(
    page.getByRole("button", { name: "Vista individual", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Agregar ejercicios", exact: true })
    .click();
  await page.getByRole("button", { name: "Abdominales", exact: true }).click();
  await page.getByLabel("Seleccionar Plancha", { exact: true }).check();
  await page.getByRole("button", { name: /Agregar seleccionados/ }).click();
  await expect(page.locator("[data-workout-entry]")).toHaveCount(before + 1);
  await expect(page.locator(`[data-workout-entry="${before}"]`)).toContainText(
    "Plancha",
  );
  await page.reload();
  await expect(page.locator("[data-workout-entry]")).toHaveCount(before + 1);
  await page
    .getByRole("button", { name: "Agregar ejercicios", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Crear ejercicio", exact: false })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre", exact: true })
    .fill("Remo personal de prueba");
  await page
    .getByLabel("Grupo muscular", { exact: true })
    .selectOption("Espalda");
  await page
    .getByRole("button", { name: "Guardar ejercicio", exact: true })
    .click();
  await expect(
    page.getByLabel("Seleccionar Remo personal de prueba", { exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: /Agregar seleccionados/ }).click();
  await expect(page.locator("[data-workout-entry]")).toHaveCount(before + 2);
  await page.reload();
  await expect(
    page.locator(`[data-workout-entry="${before + 1}"]`),
  ).toContainText("Remo personal de prueba");
});
