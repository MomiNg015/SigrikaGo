import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const directory = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const checks = [];
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    for (const layout of ['dossier', 'horizontal', 'notebook']) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(`http://127.0.0.1:5194/docs/design-samples/profile-layouts-2026-10-09/index.html?layout=${layout}`);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        images: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
        font: document.fonts.check('28px "Sigrika Window Title"'),
        collisions: [...document.querySelectorAll('tbody tr')].some((row) => {
          const cells = [...row.children];
          const identity = cells[0].querySelector('.character span').getBoundingClientRect();
          return identity.right > cells[1].getBoundingClientRect().left;
        }),
      }));
      if (geometry.overflow || !geometry.images || !geometry.font || geometry.collisions) throw new Error(`${layout} ${viewport.width}: ${JSON.stringify(geometry)}`);
      await page.screenshot({ path: path.join(directory, `${layout}-${viewport.width}.png`), fullPage: true });
      await page.locator('[data-mode="standard"]').click();
      if (await page.locator('tbody tr').count() !== 3) throw new Error('Standard sample did not switch');
      await page.locator('[data-mode="gomoku"]').click();
      if (!(await page.locator('.empty-records').isVisible())) throw new Error('Missing empty records');
      await page.locator('[data-mode="spark"]').click();
      await page.locator('[data-detail="achievement"]').click();
      if (!(await page.locator('#detail-dialog').isVisible())) throw new Error('Achievement dialog did not open');
      await page.keyboard.press('Escape');
      await page.locator('[data-detail="personalization"]').click();
      await page.locator('#name-input').fill('宽字姓名测试');
      await page.locator('#save-name').click();
      if (!(await page.locator('.identity h2').textContent()).includes('宽字姓名测试')) throw new Error('Sample name did not update');
      await page.locator('[data-detail="replay"]').click();
      if (await page.locator('.replay-list>div').count() !== 4) throw new Error('Replay fixture missing');
      await page.keyboard.press('Escape');
      await page.locator('[data-mode="spark"]').focus();
      await page.keyboard.press('ArrowRight');
      if (await page.locator('[data-mode="standard"]').getAttribute('aria-pressed') !== 'true') throw new Error('Keyboard mode switch failed');
      await page.keyboard.press('3');
      if (!(await page.locator('.notebook').count())) throw new Error('Layout hotkey failed');
      if (viewport.width === 1440) {
        await page.locator('#phone-toggle').click();
        const width = await page.locator('#profile').evaluate((element) => element.getBoundingClientRect().width);
        if (width !== 390) throw new Error('Phone preview width incorrect');
      }
      checks.push({ layout, viewport, ...geometry, interactions: 'passed' });
      await page.close();
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(`Passed ${checks.length} viewport/layout checks, images, fonts and interactions.`);
} finally {
  await browser.close();
}
