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
