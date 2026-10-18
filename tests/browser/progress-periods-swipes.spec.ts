import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
import type { Locator } from "@playwright/test";
async function swipe(target: Locator, from: number, to: number) {
  await target.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId: 1,
    isPrimary: true,
    clientX: from,
    clientY: 220,
  });
  await target.dispatchEvent("pointerup", {
    pointerType: "touch",
    pointerId: 1,
    isPrimary: true,
    clientX: to,
    clientY: 222,
  });
}
test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  await login(page);
});
test("period menu, precise custom dates, natural resets and independent collapsible improvements", async ({
  page,
}) => {
  await page.goto("/progress");
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  const period = page.getByRole("combobox", { name: "Período", exact: true }),
    date = page.getByLabel("Fecha de referencia", { exact: true });
  const today = await page.evaluate(() => {
    const d = new Date();
    const key = (n: Date) =>
      `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return {
      monday: key(monday),
      month: key(new Date(d.getFullYear(), d.getMonth(), 1)),
      year: key(new Date(d.getFullYear(), 0, 1)),
      day: key(d),
    };
  });
  await expect(date).toHaveValue(today.monday);
  await period.selectOption("month");
  await expect(date).toHaveValue(today.month);
  await date.fill("2026-08-20");
  await expect(date).toHaveValue("2026-08-20");
  await expect(page.locator(".progress-date-range")).toContainText("20 ago");
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await expect(date).toHaveValue(today.month);
  await period.selectOption("year");
  await expect(date).toHaveValue(today.year);
  await expect(
    page.getByRole("heading", { name: "Resumen anual", exact: true }),
  ).toBeVisible();
  await period.selectOption("day");
  await expect(date).toHaveValue(today.day);
  await expect(
    page.getByRole("heading", { name: "Resumen diario", exact: true }),
  ).toBeVisible();
  await period.selectOption("all");
  await expect(
    page.getByRole("heading", { name: "Resumen de siempre", exact: true }),
  ).toBeVisible();
  await date.fill("2026-08-20");
  await expect(page.locator(".progress-date-range")).toContainText("20 ago");
  const improvements = page.locator(".progress-advances");
  await expect(improvements).toHaveAttribute("open", "");
  await page
    .getByRole("combobox", { name: "Período de avances", exact: true })
    .selectOption("quarter");
  await expect(period).toHaveValue("all");
  await improvements.locator("summary").click();
  await expect(improvements).not.toHaveAttribute("open", "");
  expect(await improvements.boundingBox()).not.toBeNull();
  const first = await page
    .locator(".progress-dashboard")
    .locator(":scope > .panel")
    .first()
    .getAttribute("class");
  expect(first).toContain("progress-advances");
  await page.screenshot({
    path: `artifacts/progress-period-menu-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("horizontal gestures navigate inner tabs then main menus and ignore controls and dialogs", async ({
  page,
}) => {
  await page.goto("/progress");
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  const intro = page.locator(".progress-intro h2");
  await swipe(intro, 250, 100);
  await expect(
    page.getByRole("button", { name: "Ejercicios", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await swipe(intro, 250, 100);
  await expect(
    page.getByRole("button", { name: "Cuerpo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await swipe(intro, 100, 250);
  await expect(
    page.getByRole("button", { name: "Ejercicios", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await swipe(
    page.getByRole("combobox", { name: "Período", exact: true }),
    250,
    100,
  );
  await expect(
    page.getByRole("button", { name: "Ejercicios", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await swipe(intro, 100, 250);
  await expect(
    page.getByRole("button", { name: "Resumen", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await swipe(intro, 100, 250);
  await expect(page).toHaveURL(/\/home$/);
  await swipe(page.locator("#main-content"), 250, 100);
  await expect(page).toHaveURL(/\/tools$/);
  await swipe(page.locator(".page-description"), 100, 250);
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/tools");
  await swipe(
    page.getByRole("timer", { name: "Cronómetro", exact: true }),
    250,
    100,
  );
  await expect(
    page.getByRole("button", { name: "Timer", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await swipe(page.getByRole("dialog"), 100, 250);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("dialog")).toBeVisible();
});
