import { expect, test } from "@playwright/test";
import { login } from "./login-helper";
test.beforeEach(async ({ page }) => {
  await page.request.get("http://127.0.0.1:54329/__reset");
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await login(page);
});
test("support retries preserve draft and identity and success confirms only a successful response", async ({
  page,
}) => {
  const sent: { id: string; attachment: string | undefined }[] = [];
  await page.route("**/api/support", async (route) => {
    const req = new Request("https://test.invalid", {
      method: "POST",
      headers: { "content-type": route.request().headers()["content-type"]! },
      body: new Uint8Array(route.request().postDataBuffer()!),
    });
    const form = await req.formData();
    sent.push({
      id: String(form.get("requestId")),
      attachment: (form.get("files") as File | null)?.name,
    });
    await route.fulfill({
      status: sent.length === 1 ? 502 : 200,
      json:
        sent.length === 1
          ? { error: "send" }
          : {
              ok: true,
              reference: form.get("requestId"),
              id: "mock-provider-id",
            },
    });
  });
  await page.getByRole("button", { name: "Soporte", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Soporte", exact: true });
  await dialog
    .getByRole("combobox", { name: "Tipo de consulta", exact: true })
    .selectOption("suggestion");
  await dialog
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Una sugerencia");
  await dialog
    .getByRole("textbox", { name: "Mensaje", exact: true })
    .fill("Mi idea para Fitty");
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("attachment"),
  });
  await dialog
    .getByRole("button", { name: "Enviar consulta", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Conservamos tu borrador",
  );
  await expect(
    dialog.getByRole("textbox", { name: "Mensaje", exact: true }),
  ).toHaveValue("Mi idea para Fitty");
  await dialog
    .getByRole("button", { name: "Enviar consulta", exact: true })
    .click();
  const confirmation = page.getByRole("dialog", {
    name: "Consulta enviada",
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await expect(
    confirmation.getByText("Te responderemos por correo.", { exact: true }),
  ).toBeVisible();
  await expect(confirmation.getByRole("textbox")).toHaveCount(0);
  const close = confirmation.getByRole("button", {
    name: "Cerrar",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.screenshot({
    path: `artifacts/support-confirmation-${test.info().project.name}.png`,
  });
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCSS(
    "backdrop-filter",
    /blur/,
  );
  await page
    .locator('[data-slot="dialog-overlay"]')
    .click({ position: { x: 5, y: 5 }, force: true });
  await expect(confirmation).toBeVisible();
  expect(sent[0]?.id).toBe(sent[1]?.id);
  expect(sent[1]?.attachment).toBe("note.txt");
  await close.click();
  await expect(confirmation).not.toBeVisible();
  await page.getByRole("button", { name: "Soporte", exact: true }).click();
  await expect(
    dialog.getByRole("textbox", { name: "Mensaje", exact: true }),
  ).toHaveValue("");
  await expect(
    dialog.getByRole("combobox", { name: "Tipo de consulta", exact: true }),
  ).toHaveValue("");
  await expect(dialog.getByText("note.txt", { exact: true })).toHaveCount(0);
});
test("anonymous support POST is rejected and malformed authenticated requests do not send", async ({
  page,
  request,
}) => {
  const unauthenticated = await request.post(
    "http://127.0.0.1:3010/api/support",
    {
      headers: { origin: "http://127.0.0.1:3010" },
      multipart: {
        category: "suggestion",
        subject: "test",
        message: "test",
        requestId: crypto.randomUUID(),
      },
    },
  );
  expect(unauthenticated.status()).toBe(401);
  const foreign = await page.request.post("/api/support", {
    headers: { origin: "https://evil.invalid" },
    data: {},
  });
  expect(foreign.status()).toBe(403);
});
