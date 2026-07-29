import { expect, test } from "@playwright/test";

test.describe("Game Setup E2E", () => {
  test("redirects unauthenticated users to sign in before creating a game", async ({ page }) => {
    await page.goto("/game/setup");

    await page.getByPlaceholder("Enter your display name").fill("Host_E2E_Player");
    await page.getByRole("button", { name: "Start game" }).click();

    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=(?:%2F|\/)game(?:%2F|\/)setup/);
  });
});
