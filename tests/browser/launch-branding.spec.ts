import { expect, test } from "@playwright/test";
import { login, openHomeSection } from "./login-helper";

test("launch isotipo disappears and does not replay during app navigation", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const splash = page.getByTestId("launch-splash");
  await expect(splash).toBeVisible();
  await expect(splash.locator("img")).toHaveAttribute(
    "src",
    "/assets/brand/fitty-isotype-512.png",
  );
  await page.screenshot({
    path: `artifacts/launch-isotype-${info.project.name}.png`,
  });
  await expect(splash).toBeHidden({ timeout: 2500 });
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/assets/brand/fitty-isotype-180.png",
  );
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("FITTY");
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).ok()).toBe(true);
  await login(page);
  await expect(splash).toBeHidden({ timeout: 4000 });
  await openHomeSection(page, "Biblioteca");
  await expect(page).toHaveURL(/\/library$/);
  await expect(splash).toHaveCount(0);
  await expect(page.locator('img[src*="fitty-isotype"]')).toHaveCount(0);
  await expect(page.locator('header img[alt="FITTY"]')).toHaveAttribute(
    "src",
    "/assets/fitty-logo.png",
  );
  await page.screenshot({
    path: `artifacts/launch-after-library-${info.project.name}.png`,
  });
});
