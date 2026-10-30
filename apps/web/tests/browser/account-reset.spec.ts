import { expect, test } from "@playwright/test";

test("temporary reset keeps authentication and returns to onboarding without downloading a backup", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("test@example.invalid");
  await page
    .getByRole("button", { name: "Enviar código", exact: true })
    .click();
  await page.getByLabel("Código del correo").fill("123456");
  await page
    .getByRole("button", { name: "Verificar código", exact: true })
    .click();
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
  const downloads: string[] = [];
  page.on("download", (download) =>
    downloads.push(download.suggestedFilename()),
  );
  await confirm.click();
  await expect(page).toHaveURL(/\/onboarding$/);
  expect(downloads).toEqual([]);
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Correo electrónico", { exact: true }),
  ).toHaveCount(0);
});
