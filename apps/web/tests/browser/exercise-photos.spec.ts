import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

const picture = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhWWvXgAAAABJRU5ErkJggg==",
    "base64",
  ),
});

test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
});

test("a new exercise keeps up to three reference photos", async ({
  page,
}, testInfo) => {
  await login(page);
  await page.goto("/library");
  await page
    .getByRole("button", { name: "Crear ejercicio", exact: false })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Nombre", exact: true })
    .fill("Máquina con fotos");
  await dialog
    .getByLabel("Grupo muscular", { exact: true })
    .selectOption("Espalda");
  const steps = dialog.locator("textarea");
  await dialog
    .getByLabel("Registrar por", { exact: true })
    .selectOption("seconds");
  await expect(dialog.locator(".exercise-tiles")).toContainText("Tiempo");
  await steps.fill("Sentate con la espalda recta");
  // One line sits in a single-row box with equal space above and below.
  expect((await steps.boundingBox())!.height).toBeLessThanOrEqual(52);
  const photos = dialog.locator(".exercise-photo-item");
  await dialog
    .getByLabel("Fotos del ejercicio", { exact: true })
    .setInputFiles(["a.png", "b.png", "c.png", "d.png"].map(picture));
  await expect(photos).toHaveCount(3);
  // The photos tile is the add button; it locks at the limit.
  const add = dialog.locator("button.exercise-tile");
  await expect(add).toBeDisabled();
  await expect(add).toContainText("3 / 3");
  await dialog.getByRole("button", { name: "Quitar foto 3" }).click();
  await expect(photos).toHaveCount(2);
  await expect(add).toBeEnabled();
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("form.png") });
  await dialog
    .getByRole("button", { name: "Guardar ejercicio", exact: true })
    .click();

  const card = page.getByRole("button", { name: "Ver Máquina con fotos" });
  await expect(card.locator("img")).toHaveAttribute("src", /^data:image\/jpeg/);
  await page.reload();
  await page
    .getByRole("searchbox", { name: "Buscar ejercicios" })
    .fill("Máquina con fotos");
  await card.click();
  const second = page.getByRole("button", { name: "Foto 2", exact: true });
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("details.png") });
});
