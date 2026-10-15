import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`default portraits across illustration and avatar surfaces at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(url => url.pathname.startsWith('/api/'), route => route.fulfill({ json: { items: [], task: null, traits: [] } }));
    for (const surface of ['match', 'result', 'loading', 'skill', 'story', 'target', 'friends', 'replay', 'leaderboard', 'watch']) {
      await page.goto(`/tests/e2e/fixtures/global-portraits.html?surface=${surface}`);
      const images = page.locator('img[src*="handbook-chibi-sprites"]');
      await expect(images.first()).toBeAttached();
      await page.evaluate(() => document.fonts.ready);
      for (const image of await images.all()) {
        // Decode also covers lazy images below the inner scroll viewport.
        await image.evaluate(image => { image.loading = 'eager'; });
        await expect.poll(() => image.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        const src = await image.getAttribute('src');
        expect(src.endsWith('-avatar.webp')).toBe(['skill', 'target', 'friends', 'replay', 'leaderboard', 'watch'].includes(surface));
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (surface === 'loading') {
        expect(await images.first().evaluate(image => { const i = image.getBoundingClientRect(), p = image.parentElement.getBoundingClientRect(); return i.top >= p.top - 1 && i.bottom <= p.bottom + 1 && i.left >= p.left - 1 && i.right <= p.right + 1; })).toBe(true);
      }
      if (surface === 'story') {
        await expect(page.locator('.onboarding-story-modal')).toHaveAttribute('data-story-presentation', 'chibi');
        if (viewport.width < 760) {
          const art = await page.locator('.onboarding-story-portrait').boundingBox();
          const dialogue = await page.locator('.onboarding-story-dialogue').boundingBox();
          expect(art.y + art.height).toBeLessThan(dialogue.y);
          expect(art.height).toBeGreaterThan(200);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test(`selection cards preserve the complete default illustrations at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/tests/e2e/fixtures/team-match.html?surface=lineup&all-owned=1');
    const sources = page.locator('.match-character-bust svg image');
    await expect(sources).toHaveCount(9);
    const fits = await sources.evaluateAll(images => images.map(image => {
      const source = image.getBoundingClientRect();
      const frame = image.closest('svg').getBoundingClientRect();
      return source.left >= frame.left - 1 && source.right <= frame.right + 1
        && source.top >= frame.top - 1 && source.bottom <= frame.bottom + 1;
    }));
    expect(fits.every(Boolean)).toBe(true);
  });

  test(`recruitment result uses a contained new full-body portrait at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/recruitment', route => route.fulfill({ json: { items: [], task: { id: 'review', status: 'ready' } } }));
    await page.route('**/api/recruitment/claim', route => route.fulfill({ json: { task: { id: 'review', status: 'claimed', result: { type: 'success', characterId: 'denia', text: '达妮娅加入围棋部！' } } } }));
    await page.goto('/tests/e2e/fixtures/global-portraits.html?surface=recruitment');
    await page.getByRole('button', { name: '瞧瞧有没有新部员！' }).click();
    const image = page.locator('.recruitment-result-success img');
    await expect(image).toHaveAttribute('src', '/assets/characters/handbook-chibi-sprites/denia.webp');
    await expect.poll(() => image.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS('object-fit', 'contain');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
