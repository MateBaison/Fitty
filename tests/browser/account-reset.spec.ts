import { expect, test } from "@playwright/test";

test("temporary reset keeps authentication and returns to onboarding after a backup and confirmed sync", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("test@example.invalid");
  await page.getByRole("button", { name: "Enviar código", exact: true }).click();
  await page.getByLabel("Código del correo").fill("123456");
  await page.getByRole("button", { name: "Verificar código", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Reiniciar cuenta", exact: true })
    .click();
  const confirm = page.getByRole("button", {
    name: "Confirmar reinicio",
    exact: true,
  });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Escribí REINICIAR para confirmar").fill("REINICIAR");
  await expect(confirm).toBeEnabled();
  const download = page.waitForEvent("download");
  await confirm.click();
  expect((await download).suggestedFilename()).toBe(
    "fitty-antes-de-reiniciar.json",
  );
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Correo electrónico", { exact: true }),
  ).toHaveCount(0);
});
