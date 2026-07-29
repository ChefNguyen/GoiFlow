import { expect, test } from "@playwright/test";

test("marketing page loads", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Quiz Mode",
    }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Start Game" })).toBeVisible();
});
