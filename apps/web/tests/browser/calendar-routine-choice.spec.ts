import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test("manual calendar entry chooses any routine day and quick start only lists active routine", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await page.getByRole("button", { name: /Nueva$/ }).click();
  await page
    .getByRole("button", { name: "Rutina personalizada", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre", { exact: true })
    .fill("Otra rutina");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page
    .getByRole("switch", {
      name: "Activar rutina: Rutina principal",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Rutina principal ·/ }),
  ).toHaveCount(3);
  await expect(page.getByRole("dialog")).not.toContainText("Otra rutina");
  await page.keyboard.press("Escape");
  await page
    .getByRole("switch", {
      name: "Activar rutina: Rutina principal",
      exact: true,
    })
    .uncheck();
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Activá una rutina");
  await page.keyboard.press("Escape");
  const date = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  await page.locator(`[data-calendar-date="${date}"]`).click();
  await page
    .getByRole("button", {
      name: "Agregar entrenamiento a este día",
      exact: true,
    })
    .click();
  await page
    .getByRole("combobox", { name: "Rutina", exact: true })
    .selectOption("r1");
  await page
    .getByRole("combobox", { name: "Nombre del día", exact: true })
    .selectOption("d1");
  await expect(page.getByRole("dialog")).toContainText(
    "Press de banca con barra",
  );
  await expect(page.getByRole("dialog").locator(".routine-day")).toHaveCount(3);
  await page.getByLabel("Peso 1 serie 1", { exact: true }).fill("40");
  await page.getByLabel("Repeticiones 1 serie 1", { exact: true }).fill("10");
  await page.screenshot({
    path: `artifacts/calendar-routine-choice-${info.project.name}.png`,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Guardar entrenamiento", exact: true })
    .click();
  await expect(page.locator(".calendar-session-summary")).toContainText(
    "Rutina principal",
  );
  await expect(page.locator(".calendar-session-summary")).toContainText(
    "Pecho y tríceps",
  );
  await expect(page.locator(".calendar-session-summary")).toContainText(
    "Volumen: 400",
  );
  await page
    .getByRole("button", {
      name: "Agregar entrenamiento a este día",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Rutina", exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("textbox", { name: "Nombre del día", exact: true })
    .fill("Entreno libre personalizado");
  await expect(
    page.getByRole("textbox", { name: "Nombre del día", exact: true }),
  ).toHaveValue("Entreno libre personalizado");
});
