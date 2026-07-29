import { expect, test } from "@playwright/test";

test.describe("Game Setup E2E", () => {
  test("renders the create-game form", async ({ page }) => {
    await page.goto("/game/setup");

    await page.getByPlaceholder("Enter your display name").fill("Host_E2E_Player");
    await expect(page.getByRole("button", { name: "Start game" })).toBeVisible();
  });
});
