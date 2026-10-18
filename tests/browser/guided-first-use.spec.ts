import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset?new=1");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
});
test("manual first use retains personal details and creates editable empty days", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Nombre", { exact: true }).fill("Manual user");
  await page
    .getByRole("combobox", { name: "País", exact: true })
    .selectOption({ label: "Uruguay" });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("radio", { name: "Tengo una rutina: quiero armarla" })
    .check();
  await page
    .getByRole("combobox", { name: "Experiencia previa", exact: true })
    .selectOption("experienced");
  await expect(
    page.getByRole("combobox", {
      name: "Días de entrenamiento por semana",
      exact: true,
    }),
  ).toHaveValue("4");
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Manual user",
  );
  await expect(
    page.getByRole("combobox", { name: "País", exact: true }),
  ).toHaveValue("Uruguay");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Crear rutina y entrar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/home$/);
  const state = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem(
        "mrgymson-user-11111111-1111-4111-8111-111111111111",
      )!,
    ),
  );
  const routine = state.routines.find(
    (r: { id: string }) => r.id === state.selected,
  );
  expect(routine.days).toHaveLength(4);
  expect(
    routine.days.every((d: { items: string[] }) => d.items.length === 0),
  ).toBe(true);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/home$/);
});
test("global support remains left of sign out and header fits small screens", async ({
  page,
}) => {
  await login(page);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const header = page.locator(".app-header");
    const support = header.getByRole("button", {
      name: "Soporte",
      exact: true,
    });
    const exit = header.getByRole("button", {
      name: "Salir de la cuenta",
      exact: true,
    });
    const a = await support.boundingBox(),
      b = await exit.boundingBox();
    expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await support.click();
    await expect(
      page.getByRole("dialog", { name: "Soporte", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("failed onboarding sync can retry after reload without duplicating the routine", async ({
  page,
}) => {
  await login(page);
  let failWrites = true;
  await page.route("**/rest/v1/mrgymson_state*", (route) => {
    if (failWrites && ["PATCH", "POST"].includes(route.request().method()))
      return route.fulfill({
        status: 503,
        body: JSON.stringify({ message: "Temporary failure" }),
      });
    return route.continue();
  });
  await page.getByLabel("Nombre", { exact: true }).fill("Retry user");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Crear rutina y entrar", exact: true })
    .click();
  const retry = page.getByRole("button", {
    name: "Reintentar sincronización",
    exact: true,
  });
  await expect(retry).toBeEnabled();
  const before = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem(
        "mrgymson-user-11111111-1111-4111-8111-111111111111",
      )!,
    );
    return {
      ids: state.routines.map((r: { id: string }) => r.id),
      selected: state.selected,
    };
  });
  await page.reload();
  await expect(page.getByText("Paso 2 de 2 · Tu entrenamiento")).toBeVisible();
  failWrites = false;
  await retry.click();
  await expect(page).toHaveURL(/\/home$/);
  const after = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem(
        "mrgymson-user-11111111-1111-4111-8111-111111111111",
      )!,
    );
    return {
      ids: state.routines.map((r: { id: string }) => r.id),
      selected: state.selected,
    };
  });
  expect(after).toEqual(before);
});
