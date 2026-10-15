import { expect, test } from "@playwright/test";
import { login } from "./login-helper";

test("boxing bells, fifteen-second boards and final signal survive audio suspension", async ({
  page,
}, info) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await page.addInitScript(() => {
    let count = 0;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      (window as Window & { testAudio?: AudioContext }).testAudio = this;
      const oscillator = create.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (when) => {
        document.documentElement.dataset.soundCount = String(++count);
        start(when);
      };
      return oscillator;
    };
  });
  await page.clock.install();
  await login(page);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Herramientas", exact: true })
    .click();
  await page.getByRole("button", { name: "Combate", exact: true }).click();
  await page.getByLabel("Rondas", { exact: true }).fill("2");
  await page.getByLabel("Trabajo (seg)", { exact: true }).fill("16");
  await page.getByLabel("Descanso (seg)", { exact: true }).fill("1");
  await page.getByLabel("Preparación (seg)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  const count = (value: number) =>
    expect(page.locator("html")).toHaveAttribute(
      "data-sound-count",
      String(value),
    );
  await page.clock.runFor(1000);
  await count(18);
  await page.evaluate(async () => {
    await (
      window as Window & { testAudio?: AudioContext }
    ).testAudio!.suspend();
    window.dispatchEvent(new Event("pageshow"));
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { testAudio?: AudioContext }).testAudio!.state,
      ),
    )
    .toBe("running");
  await page.clock.runFor(1000);
  await count(21);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await count(21);
  await page.clock.runFor(15000);
  await count(33);
  await page.clock.runFor(1000);
  await count(51);
  await page.clock.runFor(1000);
  await count(54);
  await page.clock.runFor(15000);
  await count(75);
  await expect(
    page.getByText("Sesión terminada", { exact: false }),
  ).toBeVisible();
  await page.clock.runFor(3000);
  await count(75);
  await page.screenshot({
    path: `artifacts/combat-audio-${info.project.name}.png`,
  });
});
