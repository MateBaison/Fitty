import { expect, test } from "@playwright/test";
import { login, openExerciseMenu } from "./login-helper";

test("workout banner, bottom add button and per-exercise settings menu", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await page.getByRole("button", { name: /Pecho y tríceps/ }).click();
  await expect(page).toHaveURL(/\/workout$/);
  // Back arrow and cancel sit inside the blue banner; no expand-all control.
  const banner = page.locator(".workout-banner");
  await expect(banner.getByRole("button", { name: "Volver" })).toBeVisible();
  await expect(
    banner.getByRole("button", { name: "Cancelar entrenamiento" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Desplegar todos|Cerrar todos/ }),
  ).toHaveCount(0);
  // "Agregar ejercicios" is the last control before finishing.
  const add = page.getByRole("button", {
    name: "Agregar ejercicios",
    exact: true,
  });
  const finish = page.getByRole("button", {
    name: "Finalizar entrenamiento",
    exact: true,
  });
  expect((await add.boundingBox())!.y).toBeLessThan(
    (await finish.boundingBox())!.y,
  );
  const lastEntry = page.locator("[data-workout-entry]").last();
  expect((await lastEntry.boundingBox())!.y).toBeLessThan(
    (await add.boundingBox())!.y,
  );
  // Gear menu: weight unit applies to the whole account and converts loads.
  await page.getByLabel("Peso 1 serie 1", { exact: true }).fill("100");
  await openExerciseMenu(page);
  for (const name of [
    "Reemplazar ejercicio",
    "Ver detalles del ejercicio",
    "Crear superserie",
    "Quitar del entrenamiento",
  ])
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Ajustes del ejercicio" }),
  ).toBeVisible();
  await page.getByRole("switch", { name: "Unidad de peso", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Peso 1 serie 1", { exact: true })).toHaveValue(
    "220.5",
  );
  // Removing an exercise asks first.
  const before = await page.locator("[data-workout-entry]").count();
  await openExerciseMenu(page);
  await page
    .getByRole("button", { name: "Quitar del entrenamiento", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Quitar", exact: true })
    .click();
  await expect(page.locator("[data-workout-entry]")).toHaveCount(before - 1);
});
