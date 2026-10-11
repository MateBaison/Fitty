import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test("days reorder without a grip, rename persists and deletion has a cancellable dialog", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  const card = page.locator(".routine-card").first();
  const days = card.locator("[data-routine-day]");
  const before = await days.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-routine-day")),
  );
  const first = days.first().locator("summary").first();
  await expect(first.locator(".drag-handle")).toHaveCount(0);
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.keyboard.press("ArrowDown");
  await expect
    .poll(() =>
      days
        .first()
        .evaluate(
          (node) => new DOMMatrix(getComputedStyle(node).transform).m42,
        ),
    )
    .not.toBe(0);
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      days.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-routine-day")),
      ),
    )
    .not.toEqual(before);
  const reordered = await days.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-routine-day")),
  );
  await page.reload();
  await expect
    .poll(() =>
      days.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-routine-day")),
      ),
    )
    .toEqual(reordered);
  await days.first().locator("summary").first().click();
  const remove = card.getByRole("button", { name: "Quitar día", exact: true });
  await expect(remove).toBeVisible();
  const background = await remove.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  expect(background).toBe("rgb(220, 38, 38)");
  expect(await remove.evaluate((node) => getComputedStyle(node).color)).toBe(
    "rgb(255, 255, 255)",
  );
  await days
    .first()
    .getByRole("button", { name: /Renombrar/ })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre", { exact: true })
    .fill("Mi día favorito");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(days.first().locator("summary").first()).toContainText(
    "Mi día favorito",
  );
  await expect(
    days.locator("button").filter({ hasText: "Quitar día" }),
  ).toHaveCount(0);
  await remove.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mi día favorito", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "El historial se conserva",
  );
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(days).toHaveCount(3);
  await remove.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mi día favorito", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Quitar día", exact: true })
    .click();
  await expect(days).toHaveCount(2);
  await card
    .getByRole("button", { name: "Eliminar rutina", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Rutina principal");
  await expect(page.getByRole("dialog")).toContainText("2 días");
  expect(
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar rutina", exact: true })
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(220, 38, 38)");
  await expect(page.getByRole("dialog")).toContainText(
    "El historial se conserva",
  );
  await page.screenshot({
    path: `artifacts/routine-delete-${info.project.name}.png`,
    animations: "disabled",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(card).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
