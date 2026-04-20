import { test, expect } from "@playwright/test";

test.describe("Game Flow E2E - Create and Play", () => {
  test("should allow a user to create a game, submit an answer, and view final results", async ({ page }) => {
    // 0. Intercept the room creation to force maxRounds = 1 for a fast test
    await page.route("**/api/game/rooms", async (route) => {
      if (route.request().method() === "POST") {
        const payload = route.request().postDataJSON();
        payload.maxRounds = 1;
        await route.continue({ postData: JSON.stringify(payload) });
      } else {
        await route.continue();
      }
    });

    // 1. Visit setup page
    await page.goto("/game/setup");
    await expect(page.locator("h1").locator("text=遊")).toBeVisible();

    // 2. We're on 'Create Game' matching form, fill details
    const createNameInput = page.getByPlaceholder("Enter your display name");
    await createNameInput.fill("Host_E2E_Player");

    // Click 'Start game'
    await page.getByRole("button", { name: "Start game" }).click();

    // 3. Game Page
    await expect(page).toHaveURL(/\/game\?session=.*&participant=.*/);
    
    // Wait for the prompt to load
    const promptLocator = page.locator("h1");
    await expect(promptLocator).not.toHaveText("...");
    
    // 4. Submit an answer
    const answerInput = page.getByPlaceholder("Hiragana or Romaji");
    await expect(answerInput).toBeVisible();
    await answerInput.fill("test_answer1");
    
    await page.getByRole("button", { name: "Submit" }).click();

    // 5. Test 3-strikes advance
    await expect(page.locator("text=Incorrect")).toBeVisible();
    await expect(page.locator("aside").filter({ hasText: "Word history" })).toContainText("test_answer1");
    
    // Attempt 2
    await answerInput.fill("test_answer2");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("aside").filter({ hasText: "Word history" })).toContainText("test_answer2");
    
    // Attempt 3
    await answerInput.fill("test_answer3");
    await page.getByRole("button", { name: "Submit" }).click();

    // 6. Wait for and Verify Results Page
    await expect(page).toHaveURL(/\/results\?session=.*&participant=.*/);
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

    // Validate leaderboard has the participant
    await expect(page.locator("td", { hasText: "Host_E2E_Player" })).toBeVisible();
  });
});
