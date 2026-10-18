import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("professional directory filters, empty state and navigation", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(nav.getByRole("link").first()).toHaveText("Profesionales");
  await expect(
    nav.getByRole("link", { name: "Inicio", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Profesionales", exact: true }).click();
  await expect(page).toHaveURL(/\/professionals$/);
  await expect(
    page.getByRole("heading", { name: "Profesionales", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Especialidad", exact: true })
    .selectOption("nutrition");
  await page.getByRole("combobox", { name: "Sexo del profesional", exact: true }).selectOption("female");
  await page.getByRole("combobox", { name: "Modalidad", exact: true }).selectOption("both");
  await page.getByLabel("Ciudad", { exact: true }).fill("Montevideo");
  await expect(
    page.getByText(
      "Todavía no hay profesionales publicados. Las postulaciones aún no están habilitadas.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.getByRole("combobox", { name: "Especialidad", exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Ciudad", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Limpiar filtros" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/professionals-${info.project.name}.png`,
    fullPage: true,
  });
});

test("professional directory requires authentication", async ({ page }) => {
  await page.goto("http://127.0.0.1:3010/professionals");
  await expect(page).toHaveURL(/\/login$/);
});
