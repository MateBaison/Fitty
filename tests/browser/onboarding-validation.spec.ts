import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test("onboarding shows missing fields and allows a complete profile without a photo", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset?new");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const error = page.getByRole("dialog", {
    name: "Completá tus datos",
    exact: true,
  });
  await expect(error).toBeVisible();
  await expect(error.getByText("Nombre", { exact: true })).toBeVisible();
  await error.getByRole("button", { name: "Revisar datos" }).click();
  await expect(
    page.getByRole("textbox", { name: "Nombre", exact: true }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Ana");
  await page
    .getByLabel("Fecha de nacimiento", { exact: true })
    .fill("1990-05-20");
  await page
    .getByRole("combobox", { name: "País", exact: true })
    .selectOption("Uruguay");
  await page.getByRole("combobox", { name: /^Altura/ }).selectOption("170");
  await page.getByRole("combobox", { name: /^Peso/ }).selectOption("65");
  await page
    .getByRole("combobox", { name: /^Género/ })
    .selectOption("undisclosed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "¿Cómo querés empezar?", exact: true }),
  ).toBeVisible();
});
