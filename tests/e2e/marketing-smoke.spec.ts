import { expect, test } from "@playwright/test";

test("marketing page loads", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Start GoiFlow with real foundations, not a disposable prototype.",
    }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Open the app" })).toBeVisible();
});
