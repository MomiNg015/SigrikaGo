import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({headless: true, channel: 'msedge'});
const output = [];
try {
  for (const context of ['self', 'social']) for (const width of [320, 360, 390, 412, 1440]) {
    const page = await browser.newPage({viewport: {width, height: width === 1440 ? 1000 : 844}, reducedMotion: 'reduce'});
    await page.route('**/api/**', async route => {
      if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue();
      return route.fulfill({json: {profile: await page.evaluate(() => window.fixtureUser)}});
    });
    await page.goto(`http://127.0.0.1:5173/.codex-run/profile-folder-preview.html?context=${context}`);
    await page.locator('.profile-character-name').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => {
      const selectors = ['.profile-resume-hero', '.profile-hero-portrait', '.profile-identity-block', '.profile-identity-actions', '.profile-folder-page', '.profile-play-tabs', '.profile-summary-item.is-primary', '.profile-recent-section', '.profile-character-name', '.profile-chain-portrait.small', '.profile-character-table td'];
      return {overflow: document.documentElement.scrollWidth > innerWidth, nodes: Object.fromEntries(selectors.map(s => {
        const e = document.querySelector(s), c = getComputedStyle(e);
        return [s, {rect: e.getBoundingClientRect().toJSON(), font: c.fontSize, grid: c.gridTemplate, margin: c.margin, padding: c.padding, scrollWidth: e.scrollWidth, width: e.clientWidth}];
      }))};
    });
    output.push({context, width, ...info});
    assert.equal(info.overflow, false);
    const n = info.nodes;
    const avatar = n['.profile-hero-portrait'].rect;
    const identity = n['.profile-identity-block'].rect;
    assert.ok(identity.left >= avatar.right, 'Username belongs right of avatar');
    assert.ok(identity.top < avatar.bottom && identity.bottom > avatar.top, 'Username and avatar share a row');
    if (width < 900) {
      assert.ok(Math.abs(identity.top + identity.height / 2 - avatar.top - avatar.height / 2) < 1, 'Identity centers align vertically');
      assert.ok(identity.left - avatar.right >= 22, '24px gap survives the avatar rotation');
      assert.ok(n['.profile-identity-actions'].rect.top >= Math.max(identity.bottom, avatar.bottom), 'Actions have a separate row');
      assert.equal(n['.profile-folder-page'].padding, '0px 18px 16px');
      assert.equal(n['.profile-character-name'].font, '14px');
      assert.equal(n['.profile-character-table td'].font, '13px');
      assert.equal(n['.profile-chain-portrait.small'].rect.width, 44);
    }
    if (width === 390 || width === 1440) await page.screenshot({path: `.trellis/tasks/10-14-mobile-profile-readability/${process.argv[2] || 'after'}-${context}-${width}.png`});
    await page.locator('.profile-character-table tbody tr').last().scrollIntoViewIfNeeded();
    const last = await page.locator('.profile-character-table tbody tr').last().boundingBox();
    assert.ok(last.y >= 0 && last.y + last.height <= (width === 1440 ? 1000 : 844), 'Last character remains reachable');
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(`.trellis/tasks/10-14-mobile-profile-readability/${process.argv[2] || 'after'}.json`, JSON.stringify(output, null, 2));
console.log(output.map(x => ({context: x.context, width: x.width, overflow: x.overflow, identity: x.nodes['.profile-identity-block'].rect, hero: x.nodes['.profile-resume-hero'].grid})));
