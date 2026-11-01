import type { Page } from "@playwright/test";

/** Opens the library zone dialog and picks one zone by its visible name. */
export async function chooseZone(page: Page, name: string) {
  await page.getByRole("button", { name: /^Seleccionar zona/ }).first().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
