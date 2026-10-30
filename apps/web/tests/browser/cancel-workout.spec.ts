import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("cancel workout asks in an in-app dialog even when the browser blocks confirm()", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  // Home-screen apps and in-app browsers can suppress native dialogs, which return false.
  await page.addInitScript(() => {
    window.confirm = () => false;
  });
  await login(page);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Rutina principal · Pecho y tríceps/ })
    .click();
  await expect(page).toHaveURL(/\/workout$/);
  await page
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Confirmar" });
  await expect(dialog).toContainText("¿Cancelar este entrenamiento?");
  await dialog.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/workout$/);
  await page
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole("button", { name: "Continuar entrenamiento" }),
  ).toHaveCount(0);
});
