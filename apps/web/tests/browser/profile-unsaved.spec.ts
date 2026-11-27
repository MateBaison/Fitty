import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
});

test("leaving the profile drops height and weight that were not saved", async ({
  page,
}) => {
  await login(page);
  const open = (name: "Inicio" | "Perfil") =>
    page
      .getByRole("navigation")
      .getByRole("link", { name, exact: true })
      .click();
  const height = page.getByRole("combobox", { name: /^Altura/ });
  const weight = page.getByRole("combobox", { name: /^Peso/ });
  const save = page.getByRole("button", { name: "Guardar cambios" });

  await open("Perfil");
  await expect(page).toHaveURL(/\/profile$/);
  const savedHeight = await height.inputValue();
  const savedWeight = await weight.inputValue();
  await height.selectOption("199");
  await weight.selectOption("400");
  await expect(save).toBeVisible();

  await open("Inicio");
  await expect(page).toHaveURL(/\/home$/);
  await open("Perfil");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(height).toHaveValue(savedHeight);
  await expect(weight).toHaveValue(savedWeight);
  await expect(save).toHaveCount(0);

  // The browser's back button must not bring the unsaved value back either.
  await weight.selectOption("400");
  await open("Inicio");
  await expect(page).toHaveURL(/\/home$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(weight).toHaveValue(savedWeight);
  await expect(save).toHaveCount(0);
});
