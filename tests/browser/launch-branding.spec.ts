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
  await expect(splash.locator(".launch-splash-wordmark")).toHaveText("Fitty");
  const brand = await splash.locator(".launch-splash-brand").boundingBox();
  const icon = await splash.locator("img").boundingBox();
  const wordmark = await splash
    .locator(".launch-splash-wordmark")
    .boundingBox();
  const viewport = page.viewportSize()!;
  expect(brand).not.toBeNull();
  expect(icon).not.toBeNull();
  expect(wordmark).not.toBeNull();
  expect(
    Math.abs(brand!.x + brand!.width / 2 - viewport.width / 2),
  ).toBeLessThan(2);
  expect(
    Math.abs(brand!.y + brand!.height / 2 - viewport.height / 2),
  ).toBeLessThan(2);
  expect(wordmark!.y).toBeGreaterThan(icon!.y + icon!.height);
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
