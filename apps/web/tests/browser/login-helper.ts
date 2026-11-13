import { expect, type Page } from "@playwright/test";
export async function login(page: Page, email = "test@example.invalid") {
  await page.goto("http://127.0.0.1:3010/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page
    .getByRole("button", { name: "Enviar código", exact: true })
    .click();
  await page.getByLabel("Código del correo").fill("123456");
  await page
    .getByRole("button", { name: "Verificar código", exact: true })
    .click();
  await expect(page).toHaveURL(/\/(home|onboarding)$/);
  await expect(page.locator("[data-sync-status]")).toBeAttached();
}

export async function openHomeSection(
  page: Page,
  label: "Biblioteca" | "Progreso",
) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Inicio", exact: true })
    .click();
  await page
    .locator(".home-section-shortcuts")
    .getByRole("link", { name: label, exact: true })
    .click();
}

/** Opens the gear menu of one exercise of the workout in progress. */
export async function openExerciseMenu(
  page: import("@playwright/test").Page,
  index = 0,
) {
  await page
    .locator(`[data-workout-entry="${index}"]`)
    .getByRole("button", { name: "Ajustes del ejercicio", exact: true })
    .click();
}
/** Switches an exercise between "Repeticiones" and "Tiempo" from its gear menu. */
export async function trackBy(
  page: import("@playwright/test").Page,
  label: "Repeticiones" | "Tiempo",
  index = 0,
) {
  await openExerciseMenu(page, index);
  const toggle = page.getByRole("switch", { name: "Medir por", exact: true });
  if (((await toggle.getAttribute("aria-checked")) === "true") !== (label === "Tiempo"))
    await toggle.click();
  await page.keyboard.press("Escape");
}
