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

test("lateral hip raises appear under abs instead of legs", async ({
  page,
}) => {
  await login(page);
  await page.goto("/library");
  await page
    .getByLabel("Buscar ejercicios", { exact: true })
    .fill("Elevaciones de cadera acostado lateralmente");
  const exercise = page.getByRole("button", {
    name: "Ver Elevaciones de cadera acostado lateralmente",
    exact: true,
  });
  await page
    .getByRole("group", { name: "Zonas musculares", exact: true })
    .getByRole("button", { name: "Abdominales", exact: true })
    .click();
  await expect(exercise).toBeVisible();
  await expect(exercise).toContainText("Abdominales");
  await page
    .getByRole("group", { name: "Zonas musculares", exact: true })
    .getByRole("button", { name: "Piernas", exact: true })
    .click();
  await expect(exercise).toHaveCount(0);
});

test("compact settings keep two columns and aligned independent save/delete actions", async ({
  page,
}) => {
  await login(page);
  await page.goto("/profile");
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  const originalViewport = page.viewportSize()!;
  for (const width of [...new Set([320, originalViewport.width])]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Configuración", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Configuración",
      exact: true,
    });
    const weight = await dialog
      .getByRole("combobox", { name: "Peso", exact: true })
      .boundingBox();
    const height = await dialog
      .getByRole("combobox", { name: "Altura", exact: true })
      .boundingBox();
    const distance = await dialog
      .getByRole("combobox", { name: "Distancia", exact: true })
      .boundingBox();
    const remove = dialog.getByRole("button", {
      name: "Eliminar cuenta",
      exact: true,
    });
    const save = dialog.getByRole("button", {
      name: "Guardar configuración",
      exact: true,
    });
    // Read both rectangles in one frame so the dialog entry animation cannot skew alignment.
    const [removeBox, saveBox] = await dialog
      .locator(".settings-actions > button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const { x, y, width, height } = button.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
    expect(Math.abs(weight!.y - height!.y)).toBeLessThan(1);
    expect(height!.x).toBeGreaterThan(weight!.x + weight!.width);
    expect(distance!.y).toBeGreaterThan(weight!.y + weight!.height);
    expect(Math.abs(removeBox!.y - saveBox!.y)).toBeLessThan(1);
    expect(Math.abs(removeBox!.height - saveBox!.height)).toBeLessThan(1);
    expect(removeBox!.x + removeBox!.width).toBeLessThan(saveBox!.x);
    expect(saveBox!.x + saveBox!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/settings-${width}.png` });
    // Opening deletion must neither submit settings nor nest the two forms.
    await remove.click();
    await expect(
      dialog.getByRole("button", {
        name: "Eliminar definitivamente",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(dialog.locator("form form")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await dialog
      .getByRole("combobox", { name: "Distancia", exact: true })
      .selectOption("mi");
    await save.click();
    await expect(dialog).toHaveCount(0);
    await page
      .getByRole("button", { name: "Configuración", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("combobox", { name: "Distancia", exact: true }),
    ).toHaveValue("mi");
    await page.keyboard.press("Escape");
  }
});
