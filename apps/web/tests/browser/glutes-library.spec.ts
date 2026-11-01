import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
import { chooseZone } from "./zones";
import { readFileSync } from "node:fs";

// Playwright's loader cannot import the catalog JSON, so count selectable exercises from the files.
const data = (path: string) =>
  new URL(`../../../../packages/core/src/data/${path}`, import.meta.url);
const catalogIds = [
  ...(JSON.parse(readFileSync(data("legacy/exercises.json"), "utf8")) as {
    id: string;
  }[]),
  ...(JSON.parse(readFileSync(data("additional-exercises.json"), "utf8")) as {
    id: string;
  }[]),
].map((exercise) => exercise.id);
const retired = new Set(
  (
    /retiredExerciseIds = new Set\(\[([^\]]*)\]/.exec(
      readFileSync(data("exercises.ts"), "utf8"),
    )?.[1] ?? ""
  )
    .match(/"[^"]+"/g)
    ?.map((id) => id.slice(1, -1)),
);
const availableExercises = catalogIds.filter((id) => !retired.has(id));

test("glutes has its own cover and exercises while Full body includes every choice", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
  await page.goto("/library");
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  const summary = page.locator(".muscle-summary");
  await expect(
    summary.getByRole("button", { name: /Seleccionar zona: Todo/ }),
  ).toBeVisible();
  await expect(summary.getByRole("img")).toHaveAttribute(
    "src",
    "/assets/grupo-full-body-v1.jpg",
  );
  await expect(page.locator(".exercise-grid > button")).toHaveCount(
    availableExercises.length,
  );
  await chooseZone(page, "Glúteos");
  await expect(
    summary.getByRole("button", { name: /Seleccionar zona: Glúteos/ }),
  ).toBeVisible();
  await expect(summary.getByRole("img")).toHaveAttribute(
    "src",
    "/assets/grupo-gluteos-v1.jpg",
  );
  await expect(summary.getByRole("img")).toHaveJSProperty("naturalWidth", 1024);
  await expect(page.locator(".exercise-grid > button")).toHaveCount(13);
  await expect(
    page.getByRole("button", {
      name: "Ver Caminata lateral con minibanda",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/glutes-library-${test.info().project.name}.png`,
  });
  await chooseZone(page, "Piernas");
  await expect(
    page.getByRole("button", {
      name: "Ver Caminata lateral con minibanda",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver Sentadilla", exact: true }),
  ).toBeVisible();
  await chooseZone(page, "Todo");
  await expect(page.locator(".exercise-grid > button")).toHaveCount(
    availableExercises.length,
  );
  await expect(summary.getByRole("img")).toHaveJSProperty("naturalWidth", 1024);
  await page.screenshot({
    path: `artifacts/full-body-library-${test.info().project.name}.png`,
  });
});
