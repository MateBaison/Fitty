import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test("home has square library and progress shortcuts below the calendar", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(4);
  const cards = page.locator(".home-section-shortcuts");
  await cards.scrollIntoViewIfNeeded();
  await expect(cards.getByRole("link")).toHaveCount(2);
  const calendarBox = await page.locator(".calendar-panel").boundingBox(),
    cardsBox = await cards.boundingBox();
  expect(cardsBox!.y).toBeGreaterThanOrEqual(
    calendarBox!.y + calendarBox!.height,
  );
  for (const card of await cards.getByRole("link").all()) {
    const box = await card.boundingBox();
    expect(Math.abs(box!.width - box!.height)).toBeLessThan(2);
  }
  await page.screenshot({
    path: `artifacts/home-shortcuts-${info.project.name}.png`,
    animations: "disabled",
  });
  await cards.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Inicio", exact: true })
    .click();
  await cards.getByRole("link", { name: "Progreso", exact: true }).click();
  await expect(page).toHaveURL(/\/progress$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
