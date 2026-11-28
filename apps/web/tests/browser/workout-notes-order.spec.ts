import { expect, test, type Page } from "@playwright/test";
import { login, openExerciseMenu } from "./login-helper";

const names = (page: Page) =>
  page.locator("[data-workout-entry] > summary strong").allTextContents();
const summary = (page: Page, index: number) =>
  page.locator(`[data-workout-entry="${index}"] > summary`);

const overlay = (page: Page) => page.locator(".workout-reorder");
const rows = (page: Page) => overlay(page).locator(".workout-reorder-slot");

/**
 * Holds the name of an exercise with a finger or the mouse and returns the
 * ways to keep moving that same pointer and to let go.
 */
async function hold(page: Page, index: number, touch: boolean) {
  const target = summary(page, index).locator("strong");
  // Centered, so the sticky header cannot cover it.
  await target.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  const box = (await target.boundingBox())!;
  const point = { x: box.x + 10, y: box.y + box.height / 2 };
  const session = touch ? await page.context().newCDPSession(page) : null;
  if (session)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
  else {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
  }
  await expect(overlay(page)).toHaveAttribute("data-open", "true");
  // The rows finish folding.
  await page.waitForTimeout(350);
  let y = point.y;
  return {
    async drag(distance: number) {
      const from = y;
      for (let step = 1; step <= 12; step += 1) {
        y = from + (distance * step) / 12;
        if (session)
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: point.x, y }],
          });
        else await page.mouse.move(point.x, y);
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(250);
    },
    async release() {
      if (session) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await session.detach();
      } else await page.mouse.up();
      await expect(overlay(page)).toHaveCount(0);
    },
  };
}

/** Distance between the same point of two compact rows. */
async function between(page: Page, from: number, to: number) {
  const a = (await rows(page).nth(from).boundingBox())!,
    b = (await rows(page).nth(to).boundingBox())!;
  return b.y - a.y;
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
  const trash = noteDialog.getByRole("button", {
    name: "Eliminar nota",
    exact: true,
  });
  // Nothing to delete yet, and the exercise name is not repeated.
  await expect(noteDialog.getByRole("textbox")).toBeVisible();
  await expect(trash).toHaveCount(0);
  await expect(noteDialog).not.toContainText("Press banca");
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

  // Holding an exercise folds them all into rows, in place and with no window.
  const before = await names(page);
  const still = await hold(page, 1, touch);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(rows(page)).toHaveCount(before.length);
  await expect(rows(page).locator("strong")).toHaveText(before);
  await expect(
    rows(page).nth(1).locator(".workout-reorder-row"),
  ).toHaveAttribute("data-dimmed", "true");
  // The rows gather at the top, wherever the exercise was held.
  const header = (await page.locator(".app-header").boundingBox())!,
    first = (await rows(page).nth(0).boundingBox())!;
  expect(first.y - (header.y + header.height)).toBeCloseTo(16, 0);
  await page.screenshot({
    path: `artifacts/workout-reorder-held-${info.project.name}.png`,
  });
  // Letting go without moving changes nothing and does not fold the card.
  const openBefore = await page
    .locator("[data-workout-entry]")
    .evaluateAll((list) =>
      list.map((element) => (element as HTMLDetailsElement).open),
    );
  await still.release();
  expect(await names(page)).toEqual(before);
  expect(
    await page
      .locator("[data-workout-entry]")
      .evaluateAll((list) =>
        list.map((element) => (element as HTMLDetailsElement).open),
      ),
  ).toEqual(openBefore);

  // The same pointer drags it up, and releasing applies the new order.
  const held = await hold(page, 1, touch);
  const scroll = await page.evaluate(() => window.scrollY);
  await held.drag(await between(page, 1, 0));
  await expect(
    rows(page).nth(1).locator(".workout-reorder-row"),
  ).not.toHaveAttribute("data-dimmed", "true");
  const moved = (await rows(page).nth(1).boundingBox())!,
    other = (await rows(page).nth(0).locator("strong").boundingBox())!;
  expect(other.y).toBeGreaterThan(moved.y);
  await page.screenshot({
    path: `artifacts/workout-reorder-drag-${info.project.name}.png`,
  });
  // Dragging never scrolls the page underneath.
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await held.release();
  const swapped = [before[1]!, before[0]!, ...before.slice(2)];
  await expect.poll(() => names(page)).toEqual(swapped);

  // Alt + arrows move it too, keeping the focus on the moved exercise.
  await summary(page, 0).focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect.poll(() => names(page)).toEqual(before);
  await expect(summary(page, 1)).toBeFocused();
  await page.keyboard.press("Alt+ArrowUp");
  await expect.poll(() => names(page)).toEqual(swapped);

  // Escape lets go without moving.
  const cancelled = await hold(page, 0, touch);
  await cancelled.drag(await between(page, 0, 1));
  await page.keyboard.press("Escape");
  await expect(overlay(page)).toHaveCount(0);
  await cancelled.release();
  expect(await names(page)).toEqual(swapped);

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
  await expect(overlay(page)).toHaveCount(0);

  // The bin at the top right deletes the note after asking.
  const second = page.locator('[data-workout-entry="1"]');
  if (!(await second.evaluate((element: HTMLDetailsElement) => element.open)))
    await summary(page, 1).locator("strong").click();
  await noteButton.click();
  const back = (await noteDialog
      .getByRole("button", { name: "Volver", exact: true })
      .boundingBox())!,
    bin = (await trash.boundingBox())!;
  expect(bin.y).toBe(back.y);
  expect(bin.x).toBeGreaterThan(back.x + 100);
  await page.screenshot({
    path: `artifacts/workout-note-dialog-${info.project.name}.png`,
  });
  await trash.click();
  const confirm = page.getByRole("dialog", { name: "¿Eliminar la nota?" });
  await confirm.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(noteDialog.getByRole("textbox")).toHaveValue(
    "Banco en la posición 4",
  );
  await trash.click();
  await confirm.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(noteDialog).toHaveCount(0);
  await expect(noteButton).toHaveCount(0);
});
