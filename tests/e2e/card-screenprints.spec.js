import { expect, test } from "@playwright/test";

const base = "/docs/design-samples/academy-card-materials-2026-10-22/";
const profile = [
  [".profile-resume-hero", "identity"], [".profile-summary-item.is-primary", "rank"],
  [".profile-record-card", "record"], [".profile-recent-section", "record"], [".profile-character-section", "record"]
];
const windows = {
  self: profile, social: profile,
  friends: [[".fc-person", "social"], [".fc-detail", "social"]],
  warehouse: [[".wg-entry", "inventory"], [".wg-inspector", "inventory"]],
  watch: [[".wl-row", "tactics", "::before"]],
  handbook: [[".character-skill-description", "tactics"], [".character-description", "reading"]],
  achievement: [[".achievement-row:not(.achievement-heading)", "honor"]],
  announcement: [[".announcement-list-item", "reading"], [".announcement-detail", "reading"]]
};
async function settle(page, selector) {
  await page.locator(selector).first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
  });
}
async function cards(page, [selector, , pseudo]) {
  return page.locator(selector).evaluateAll((elements, pseudoElement) => elements.map(element => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element, pseudoElement);
    return {
      box: [rect.x, rect.y, rect.width, rect.height].map(value => Math.round(value * 10) / 10),
      text: element.textContent,
      fill: style.backgroundColor, image: style.backgroundImage,
      size: style.backgroundSize.split(",").at(-1).trim(),
      position: style.backgroundPosition.split(",").at(-1).trim(),
      repeat: style.backgroundRepeat.split(",").at(-1).trim()
    };
  }), pseudo);
}

for (const width of [1440, 390, 320]) {
  for (const [surface, roles] of Object.entries(windows)) {
    test(`${surface} keeps the approved card layout and function prints at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : width === 390 ? 844 : 568 });
      await page.goto(`${base}sample.html?v=screenprint-roles&window=${surface}`);
      if (surface === "announcement") await page.locator(".announcement-list-item").first().click();
      await settle(page, roles[0][0]);
      const approved = await Promise.all(roles.map(role => cards(page, role)));
      await page.goto(`${base}production.html?window=${surface}`);
      if (surface === "announcement") await page.locator(".announcement-list-item").first().click();
      await settle(page, roles[0][0]);
      await expect(page.locator("[data-material], #material-preview")).toHaveCount(0);
      expect(await page.evaluate(() => [...document.styleSheets].some(sheet => /\/(?:materials|screenprint-roles|preview-isolation|harness)\.css/.test(sheet.href || sheet.ownerNode?.getAttribute("data-vite-dev-id") || "")))).toBe(false);
      for (const [index, role] of roles.entries()) {
        const actual = await cards(page, role);
        expect(actual.length).toBeGreaterThan(0);
        expect(actual.map(({ image: _image, box: _box, ...rest }) => rest)).toEqual(approved[index].map(({ image: _image, box: _box, ...rest }) => rest));
        for (const [cardIndex, card] of actual.entries()) {
          for (const [coordinate, value] of card.box.entries()) {
            // Native table row distribution can round fractions differently after a reload.
            expect(Math.abs(value - approved[index][cardIndex].box[coordinate])).toBeLessThan(0.5);
          }
        }
        for (const card of actual) {
          expect(card.image).toContain(`/assets/ui/card-prints/${role[1]}.svg`);
          expect(card.repeat).toBe("no-repeat");
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("every public print loads and non-campus/corrupted surfaces stay isolated", async ({ page, request }) => {
  for (const role of ["identity", "record", "social", "inventory", "tactics", "reading", "honor", "rank"]) {
    const response = await request.get(`/assets/ui/card-prints/${role}.svg`);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("<svg");
  }
  await page.goto(`${base}production.html?window=self`);
  await settle(page, ".profile-resume-hero");
  const image = () => page.locator(".profile-resume-hero").evaluate(element => getComputedStyle(element).backgroundImage);
  await page.locator(".app-shell").evaluate(element => element.classList.add("is-sigrika-corrupted"));
  expect(await image()).not.toContain("card-prints");
  await page.locator(".app-shell").evaluate(element => { element.classList.remove("is-sigrika-corrupted"); element.classList.remove("theme-bright-school"); });
  expect(await image()).not.toContain("card-prints");
  await page.goto(`${base}sample.html?window=self&off=1`);
  await settle(page, ".profile-resume-hero");
  expect(await image()).toBe("none");
});

test("selection, finished-room hover and pressed cards preserve their print and fill", async ({ page }) => {
  for (const [surface, selector] of [["friends", ".fc-person"], ["warehouse", ".wg-entry"]]) {
    await page.goto(`${base}production.html?window=${surface}`);
    await settle(page, selector);
    const card = page.locator(selector).nth(1);
    const paint = () => card.evaluate(element => ({ image:getComputedStyle(element).backgroundImage, fill:getComputedStyle(element).backgroundColor }));
    const before = await paint();
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    expect((await paint()).image).toBe(before.image);
    await card.hover();
    await page.mouse.down();
    expect((await paint()).image).toBe(before.image);
    await page.mouse.up();
  }
  await page.goto(`${base}production.html?window=watch`);
  await settle(page, ".wl-row.finished");
  const finished = page.locator(".wl-row.finished").first();
  const paint = () => finished.evaluate(element => ({ image:getComputedStyle(element, "::before").backgroundImage, fill:getComputedStyle(element, "::before").backgroundColor }));
  const before = await paint();
  await finished.locator("button").hover();
  expect(await paint()).toEqual(before);
  await page.mouse.down();
  expect(await paint()).toEqual(before);
  await page.mouse.up();
});
