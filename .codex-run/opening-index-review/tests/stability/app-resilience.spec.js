import { expect, test } from "@playwright/test";

test("keeps the app mounted when runtime audio and effect assets fail", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/assets/music/**", (route) => route.fulfill({
    status: 200,
    contentType: "audio/ogg",
    body: "not an audio file"
  }));
  await page.route("**/assets/effects/**", (route) => route.abort());

  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.locator("#root > *")).toHaveCount(1);
  await expect(page.locator(".app-error-boundary")).toHaveCount(0);

  await page.reload();
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.locator("#root > *")).toHaveCount(1);
  await expect(page.locator(".app-error-boundary")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
