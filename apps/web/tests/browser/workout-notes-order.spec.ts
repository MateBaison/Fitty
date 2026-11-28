import { expect, test, type Page } from "@playwright/test";
import { login, openExerciseMenu } from "./login-helper";

const names = (page: Page) =>
  page.locator("[data-workout-entry] > summary strong").allTextContents();
const summary = (page: Page, index: number) =>
  page.locator(`[data-workout-entry="${index}"] > summary`);

/** Presses and holds the name of an exercise, like a finger would. */
async function hold(page: Page, index: number, touch: boolean) {
  const target = summary(page, index).locator("strong");
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const point = { x: box.x + 10, y: box.y + box.height / 2 };
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await page.waitForTimeout(700);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
  }
}

test("exercise notes stay with the exercise and holding it reorders the workout", async ({
  page,
}, info) => {
  const touch = info.project.name === "mobile";
  if (touch) await page.setViewportSize({ width: 320, height: 844 });
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
  await expect(page.getByLabel("Comentarios 1", { exact: true })).toBeVisible();

  // A note is written from the gear menu; only then its symbol appears.
  const noteButton = page.getByRole("button", {
    name: "Ver nota del ejercicio",
    exact: true,
  });
  await expect(noteButton).toHaveCount(0);
  await openExerciseMenu(page);
  await page
    .getByRole("button", { name: "Notas de ejercicio", exact: true })
    .click();
  const noteDialog = page.getByRole("dialog", { name: "Notas de ejercicio" });
  await noteDialog.getByRole("textbox").fill("Banco en la posición 4");
  await noteDialog
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(noteDialog).toHaveCount(0);
  const tools = page.locator('[data-workout-entry="0"] .set-tools button');
  await expect(tools).toHaveCount(3);
  await expect(tools.nth(1)).toHaveAccessibleName("Ver nota del ejercicio");
  await noteButton.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `artifacts/workout-note-button-${info.project.name}.png`,
  });
  await noteButton.click();
  await expect(noteDialog.getByRole("textbox")).toHaveValue(
    "Banco en la posición 4",
  );
  await page.keyboard.press("Escape");
  await expect(noteDialog).toHaveCount(0);

  // Holding an exercise opens the reorder window, which stays after letting go.
  const before = await names(page);
  await hold(page, 1, touch);
  const dialog = page.getByRole("dialog", { name: "Ordenar ejercicios" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(400);
  await expect(dialog).toBeVisible();
  const rows = dialog.locator(".reorder-row");
  await expect(rows).toHaveCount(before.length);
  await expect(rows.nth(1)).toHaveAttribute("data-highlighted", "true");
  await page.screenshot({
    path: `artifacts/workout-reorder-${info.project.name}.png`,
  });
  const from = (await rows.nth(1).boundingBox())!,
    to = (await rows.nth(0).boundingBox())!;
  await page.mouse.move(from.x + 40, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + 40, to.y + 4, { steps: 12 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  const swapped = [before[1]!, before[0]!, ...before.slice(2)];
  await expect.poll(() => names(page)).toEqual(swapped);
  // The arrow keys move rows too, keeping the focus on the moved one.
  await rows.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => names(page)).toEqual(before);
  await expect(rows.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => names(page)).toEqual(swapped);
  await dialog.getByRole("button", { name: "Listo", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  // The note followed its exercise, and the order survives a reload.
  await expect(
    page.locator('[data-workout-entry="1"] .set-note-button'),
  ).toHaveCount(1);
  await page.reload();
  await expect.poll(() => names(page)).toEqual(swapped);
  await expect(
    page.locator('[data-workout-entry="1"] .set-note-button'),
  ).toHaveCount(1);

  // A normal press still folds the exercise, and the gear never reorders.
  const entry = page.locator('[data-workout-entry="0"]');
  const wasOpen = await entry.evaluate(
    (element: HTMLDetailsElement) => element.open,
  );
  await summary(page, 0).locator("strong").click();
  await expect
    .poll(() => entry.evaluate((element: HTMLDetailsElement) => element.open))
    .toBe(!wasOpen);
  await expect(dialog).toHaveCount(0);
  // Right click does the same as holding.
  await summary(page, 0).locator("strong").click({ button: "right" });
  await expect(dialog).toBeVisible();
});
