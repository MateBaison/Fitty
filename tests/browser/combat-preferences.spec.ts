import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("custom combat values survive reload and preset buttons are absent", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  const openClock = async () => {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Herramientas", exact: true })
      .click();
    await page.getByRole("button", { name: "Combate", exact: true }).click();
  };
  await openClock();
  for (const name of ["Boxeo", "TABATA", "HIIT", "Muay Thai"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  const values = {
    Rondas: "7",
    "Trabajo (seg)": "145",
    "Descanso (seg)": "35",
    "Preparación (seg)": "12",
  };
  for (const [name, value] of Object.entries(values))
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Reiniciar", exact: true }).click();
  await page.reload();
  await openClock();
  for (const [name, value] of Object.entries(values))
    await expect(page.getByLabel(name, { exact: true })).toHaveValue(value);
  await expect(page.getByTestId("launch-splash")).toBeHidden();
  await page.screenshot({
    path: `artifacts/combat-preferences-${test.info().project.name}.png`,
  });
});
