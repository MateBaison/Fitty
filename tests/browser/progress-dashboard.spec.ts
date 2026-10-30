import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  await login(page);
});
test("unified periods, glute bars, exercise records and body measurements", async ({
  page,
}, info) => {
  await page.evaluate(() => {
    const key = "fitty-user-11111111-1111-4111-8111-111111111111";
    const s = JSON.parse(localStorage.getItem(key)!);
    const today = new Date();
    s.sessions = [0, 1].map((i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - 1 + i);
      return {
        id: `progress-${i}`,
        date: date.toISOString(),
        routine: "Rutina de prueba",
        day: "Día de glúteos",
        duration: 35 + i * 5,
        sets: 3,
        volumeKg: 300,
        groupSets: { Glúteos: 3 },
        exercises: [
          {
            id: "elevaciones-de-cadera-con-barra",
            group: "Glúteos",
            performedSets: [
              { kg: 20 + i * 5, reps: 10, entered: true, done: true },
            ],
          },
        ],
      };
    });
    localStorage.setItem(key, JSON.stringify(s));
    const meta = JSON.parse(localStorage.getItem(key + ":sync-meta-v1")!);
    localStorage.setItem(
      key + ":sync-meta-v1",
      JSON.stringify({ ...meta, pending: true }),
    );
  });
  await page.goto("/progress");
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Período", exact: true })
    .selectOption("month");
  await expect(
    page.getByRole("region", { name: "Resumen", exact: true }),
  ).toBeVisible();
  await page
    .getByText("Ver detalle del entrenamiento", { exact: true })
    .click();
  await expect(page.locator(".progress-muscle-bars")).toContainText("Glúteos");
  await page
    .getByRole("button", { name: "Comparar períodos", exact: true })
    .click();
  const comparison = page.getByRole("region", {
    name: "Comparar períodos",
    exact: true,
  });
  await expect(comparison.getByRole("table")).toBeVisible();
  await comparison
    .getByRole("group", { name: "Período A", exact: true })
    .getByLabel("Desde", { exact: true })
    .fill("2020-01-01");
  await comparison
    .getByRole("group", { name: "Período A", exact: true })
    .getByLabel("Hasta", { exact: true })
    .fill("2020-01-31");
  await expect(
    comparison.getByRole("row", { name: /Entrenamientos/ }),
  ).toContainText("0");
  await page
    .getByRole("button", { name: "Cerrar comparación", exact: true })
    .click();
  await expect(page.locator(".progress-stat").first()).toContainText("2");
  await page.screenshot({
    path: `artifacts/progress-redesign-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ejercicios", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Elegí un ejercicio", exact: true }),
  ).toHaveValue("elevaciones-de-cadera-con-barra");
  await expect(page.getByRole("img", { name: /Carga máxima/ })).toBeVisible();
  await page.locator(".progress-point-picker button").first().click();
  await expect(page.locator(".progress-chart-value strong")).toContainText(
    "20 kg",
  );
  await page.locator(".progress-records button").first().click();
  await expect(page.getByRole("dialog")).toContainText("Día de glúteos");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Cuerpo", exact: true }).click();
  await page
    .getByRole("button", { name: "Agregar registro", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Agregar registro corporal",
    exact: true,
  });
  await dialog.getByLabel("Peso (kg)", { exact: true }).fill("72.5");
  await dialog.getByLabel("Cintura (cm)", { exact: true }).fill("80");
  await dialog
    .locator('input[type="file"]')
    .setInputFiles("public/assets/grupo-piernas.jpg");
  await dialog
    .getByRole("button", { name: "Guardar registro", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".progress-photo-comparison")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Agregar registro", exact: true })
    .click();
  const yesterday = await page.evaluate(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  await dialog.getByLabel("Fecha", { exact: true }).fill(yesterday);
  await dialog
    .locator('input[type="file"]')
    .setInputFiles("public/assets/grupo-gluteos-v1.jpg");
  await dialog
    .getByRole("button", { name: "Guardar registro", exact: true })
    .click();
  await expect(page.locator(".progress-photo-comparison img")).toHaveCount(2);
  await expect(
    page.getByRole("img", { name: "Foto anterior", exact: true }),
  ).toHaveJSProperty("naturalWidth", 800);

  await expect(page.locator(".progress-chart-value strong")).toContainText(
    "72,5 kg",
  );
  await page.reload();
  await page.getByRole("button", { name: "Cuerpo", exact: true }).click();
  await expect(page.locator(".progress-chart-value strong")).toContainText(
    "72,5 kg",
  );
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/progress-body-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("upload independent dated photos directly from comparison without creating workouts", async ({
  page,
}) => {
  await page.goto("/progress");
  await page.getByRole("button", { name: "Cuerpo", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Período", exact: true })
    .selectOption("all");
  const dialog = page.getByRole("dialog", { name: "Subir foto", exact: true });
  for (const [index, file] of [
    "public/assets/grupo-piernas.jpg",
    "public/assets/grupo-gluteos-v1.jpg",
  ].entries()) {
    await page.getByRole("button", { name: "Subir foto", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Guardar foto", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Peso (kg)", { exact: true })).toHaveCount(
      0,
    );
    const date = await page.evaluate((i) => {
      const d = new Date();
      d.setDate(d.getDate() - 1 + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }, index);
    await dialog.getByLabel("Fecha", { exact: true }).fill(date);
    await dialog
      .getByLabel("Foto de progreso", { exact: true })
      .setInputFiles(file);
    await dialog
      .getByRole("button", { name: "Guardar foto", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    if (index === 0)
      await expect(
        page.getByRole("img", { name: "Foto de progreso", exact: true }),
      ).toBeVisible();
  }
  await expect(page.locator(".progress-photo-comparison img")).toHaveCount(2);
  const stored = await page.evaluate(() => {
    const s = JSON.parse(
      localStorage.getItem("fitty-user-11111111-1111-4111-8111-111111111111")!,
    );
    return {
      sessions: s.sessions.length,
      photos: s.bodyMeasurements.map(
        (m: { photo?: string; weightKg?: number }) => ({
          photo: !!m.photo,
          weight: m.weightKg,
        }),
      ),
    };
  });
  expect(stored.sessions).toBe(0);
  expect(stored.photos).toEqual([
    { photo: true, weight: undefined },
    { photo: true, weight: undefined },
  ]);
  await page.reload();
  await page.getByRole("button", { name: "Cuerpo", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Período", exact: true })
    .selectOption("all");
  await expect(page.locator(".progress-photo-comparison img")).toHaveCount(2);
  await expect(
    page.getByRole("img", { name: "Foto anterior", exact: true }),
  ).toHaveJSProperty("naturalWidth", 800);
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/direct-body-photos-${test.info().project.name}.png`,
    fullPage: true,
  });
});
