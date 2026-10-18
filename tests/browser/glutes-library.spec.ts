import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
import { availableExercises } from "../../src/data/exercises";

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
  const groups = page.getByRole("group", {
    name: "Zonas musculares",
    exact: true,
  });
  const summary = page.locator(".muscle-summary");
  await expect(groups.getByRole("button").first()).toHaveText("★ Favoritos");
  await expect(
    groups.getByRole("button", { name: "Todo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(summary.getByRole("img")).toHaveAttribute(
    "src",
    "/assets/grupo-full-body-v1.jpg",
  );
  await expect(page.locator(".exercise-grid > button")).toHaveCount(
    availableExercises.length,
  );
  await groups.getByRole("button", { name: "Glúteos", exact: true }).click();
  await expect(
    summary.getByRole("heading", { name: "Glúteos", exact: true }),
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
  await groups.getByRole("button", { name: "Piernas", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Ver Caminata lateral con minibanda",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver Sentadilla", exact: true }),
  ).toBeVisible();
  await groups.getByRole("button", { name: "Todo", exact: true }).click();
  await expect(page.locator(".exercise-grid > button")).toHaveCount(
    availableExercises.length,
  );
  await expect(summary.getByRole("img")).toHaveJSProperty("naturalWidth", 1024);
  await page.screenshot({
    path: `artifacts/full-body-library-${test.info().project.name}.png`,
  });
});
