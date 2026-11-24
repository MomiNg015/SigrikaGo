import { expect, test } from "@playwright/test";
import { settleWindow } from "./window-surfaces-fixture.js";
const preview = "/docs/design-samples/information-paper-2026-10-22/production.html";

async function wholeRows(page, kind) {
  await expect.poll(() => page.locator(`.${kind}-list`).evaluate(list => {
    const bounds = list.getBoundingClientRect();
    const visible = [...list.children].map(item => item.getBoundingClientRect()).filter(box => box.bottom > bounds.top + 1 && box.top < bounds.bottom - 1);
    return visible.length > 0 && visible.every(box => box.height >= 72 && box.top >= bounds.top && box.bottom + 6 <= bounds.bottom + 1);
  })).toBe(true);
}

async function expectCornerBadge(row) {
  const badge = row.locator(".information-card-badge").first();
  await expect(badge).toHaveCSS("border-top", "1px solid rgb(0, 0, 0)");
  await expect.poll(() => badge.evaluate(el => {
    const box = el.getBoundingClientRect();
    const card = el.closest("button").getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = card.top - 1;
    return box.left < card.left && box.top < card.top && box.right > card.left && box.bottom > card.top
      && Boolean(el.contains(document.elementFromPoint(x, y)));
  })).toBe(true);
}

async function open(page, kind, fixture = "normal") {
  await page.goto(`${preview}?window=${kind}&fixture=${fixture}`);
  await page.locator(".information-center-modal").waitFor();
  if (fixture !== "empty") await page.locator(`.${kind}-list-item`).first().waitFor();
  await settleWindow(page);
  await expect(page.locator("link[href*='/paper.css'], style[data-vite-dev-id$='/paper.css']")).toHaveCount(0);
  if (fixture !== "empty") {
    await expect.poll(() => page.locator(`.${kind}-list-item`).evaluateAll(items => items.every(item =>
      getComputedStyle(item).boxShadow.includes(item.matches('[aria-current="true"]') ? "1px 1px 0px 0px" : "5px 6px 0px 0px")
    ))).toBe(true);
  }
}

for (const [width, height] of [[1440,960], [800,900], [390,844], [360,800], [320,568], [390,600]]) {
  for (const kind of ["announcement", "mailbox"]) {
    test(`${kind} geometry, scroll and aligned actions ${width}x${height}`, async ({page}) => {
      await page.setViewportSize({width,height});
      await open(page, kind, "scroll");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await wholeRows(page, kind);
      await expectCornerBadge(page.locator(`.${kind}-list-item`).first());
      await page.locator(`.${kind}-list`).hover();
      await page.mouse.wheel(0, 150);
      await page.mouse.move(0,0);
      await expect.poll(() => page.locator(`.${kind}-list`).evaluate(e => e.scrollTop)).toBeGreaterThan(0);
      await wholeRows(page, kind);
      await page.locator(`.${kind}-list-item`).last().scrollIntoViewIfNeeded();
      await wholeRows(page, kind);
      await page.locator(`.${kind}-list-item`).first().click();
      await settleWindow(page);
      if (width <= 768) {
        const back = page.getByRole("button", {name: kind === "announcement" ? "返回公告列表" : "返回邮件列表"});
        await expect(back).toBeFocused();
        const [left, right] = await page.locator(".information-center-back-button,.information-center-close-button").evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()));
        expect(Math.abs(left.y - right.y)).toBeLessThan(.5);
        expect(Math.abs(left.height - right.height)).toBeLessThan(.5);
        expect(left.width).toBe(36);
        await back.click();
        await expect(page.locator(`.${kind}-list-item`).first()).toBeFocused();
        await expect(page.locator(".information-center-back-button")).toBeHidden();
      }
    });
  }
}

for (const kind of ["announcement", "mailbox"]) {
  for (const fixture of ["long", "empty"]) {
    test(`${kind} short portrait ${fixture}`, async ({page}) => {
      await page.setViewportSize({width:320,height:568});
      await open(page, kind, fixture);
      if (fixture === "long") {
        await wholeRows(page, kind);
        if (kind === "mailbox") {
          const row = page.locator(".mailbox-list-item").first();
          const heading = await row.locator(".mailbox-list-heading").boundingBox();
          const title = await row.locator(".mailbox-list-title").boundingBox();
          const gift = await row.locator(".mailbox-list-gift").boundingBox();
          expect(title.x + title.width).toBeLessThan(gift.x);
          expect(gift.x + gift.width).toBeCloseTo(heading.x + heading.width);
          expect(Math.abs(gift.y - title.y)).toBeLessThanOrEqual(3);
        }
        await page.locator(`.${kind}-list-item`).first().click();
        await settleWindow(page);
        const prose = page.locator(kind === "announcement" ? ".announcement-detail-body" : ".mailbox-body");
        expect(await prose.evaluate(e => e.clientHeight)).toBeGreaterThan(65);
        expect(await prose.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
        await prose.evaluate(e => e.scrollTop = e.scrollHeight);
        if (kind === "mailbox") await expect(page.getByRole("button", {name:"领取附件",exact:true})).toBeInViewport();
      } else {
        await expect(page.locator(`.${kind}-list-item`)).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    });
  }
}

test("mail attachment preview, claim, gray completion, delete and close preserve flows", async ({page}) => {
  await open(page,"mailbox");
  const first = page.locator(".mailbox-list-item").first();
  const readBadge = first.locator('.information-card-badge[data-state="read"]');
  await expect(readBadge).toHaveCSS("width", "14px");
  await expect(first.locator(".information-card-badge")).toHaveCount(1);
  await expect(readBadge).toHaveCSS("background-image", "linear-gradient(145deg, rgb(244, 243, 241), rgb(221, 220, 218))");
  await expect(readBadge.locator("svg path")).toHaveCSS("stroke", "rgb(70, 74, 81)");
  const attachment = first.locator('.mailbox-list-heading .mailbox-list-gift[data-state="claimable"]');
  await expect(attachment).toHaveCSS("width", "18px");
  await expect(attachment).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(attachment).toHaveCSS("border-top-width", "0px");
  await expect(attachment.locator(".mailbox-list-gift-box")).toHaveCSS("fill", "rgb(247, 211, 79)");
  await expect(attachment).toHaveCSS("animation-name", "mailbox-list-gift-bounce");
  await attachment.evaluate(el => {
    const animation = el.getAnimations()[0];
    animation.pause();
    animation.currentTime = 240;
  });
  await expect(attachment).toHaveCSS("translate", "0px -2px");
  await page.getByRole("button", {name:/查看道具详情/}).click();
  await expect(page.getByRole("dialog",{name:/道具详情/})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog",{name:/道具详情/})).toHaveCount(0);
  await page.getByRole("button",{name:"领取附件",exact:true}).click();
  await expect(page.getByRole("button",{name:"已领取",exact:true})).toBeDisabled();
  await expect(page.locator(".mailbox-list-item").first()).toHaveClass(/state-done/);
  const claimedGift = first.locator('.mailbox-list-gift[data-state="claimed"]');
  await expect(claimedGift.locator(".mailbox-list-gift-box")).toHaveCSS("fill", "rgb(211, 209, 206)");
  await expect(claimedGift).toHaveCSS("animation-name", "none");
  await page.getByRole("button",{name:"删除邮件",exact:true}).click();
  await expect(page.locator(".mailbox-list-item")).toHaveCount(5);
  await page.getByRole("button",{name:"关闭邮箱",exact:true}).click();
  await expect(page.locator(".information-center-modal")).toHaveCount(0);
});

test("announcement categories, reads, hover and press keep paper selection", async ({page}) => {
  await open(page,"announcement");
  await expect(page.locator(".announcement-list-item").first()).not.toHaveClass(/is-unread/);
  const unreadBadge = page.locator(".announcement-list-item").nth(1).locator('.information-card-badge[data-state="unread"]');
  await expect(unreadBadge).toHaveCSS("width", "10px");
  await expect(unreadBadge).toHaveCSS("background-image", "linear-gradient(145deg, rgb(239, 93, 85), rgb(227, 68, 70))");
  await page.getByRole("tab",{name:/日志/}).click();
  await expect(page.locator(".announcement-list-item")).toHaveCount(2);
  const row=page.locator(".announcement-list-item").last();
  await expect(row.locator('.information-card-badge[data-state="read"]')).toBeVisible();
  await row.hover();
  await expect.poll(()=>row.evaluate(e=>getComputedStyle(e).transform)).toContain("-1, -2");
  await page.mouse.down();
  await expect(row).toHaveCSS("translate", "4px 5px");
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(row).toHaveCSS("translate", "4px 5px");
  await expect(row).toHaveCSS("box-shadow", /1px 1px 0px 0px/);
  await expect(row.locator('.information-card-badge[data-state="read"] svg')).toBeVisible();
});

test("original motion and reduced-motion behavior; other themes stay outside paper sizing", async ({page}) => {
  await open(page,"mailbox");
  const motion=await page.locator(".mailbox-detail-header,.mailbox-body,.mailbox-attachment-shelf").evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return [c.animationName,c.animationDuration,c.animationDelay];}));
  expect(motion).toEqual([["mailbox-detail-content-enter","0.42s","0s"],["mailbox-detail-content-enter","0.42s","0.1s"],["mailbox-detail-content-enter","0.42s","0.2s"]]);
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(page.locator('.mailbox-list-gift[data-state="claimable"]').first()).toHaveCSS("animation-name", "none");
  expect(await page.locator(".mailbox-list-item").first().evaluate(e=>getComputedStyle(e).transitionDuration)).toBe("0s");
  await page.locator(".app-shell").evaluate(e=>e.classList.add("is-sigrika-corrupted"));
  await page.setViewportSize({width:900,height:900});
  await expect.poll(()=>page.locator(".mailbox-list").evaluate(e=>e.style.getPropertyValue("--information-paper-row-height"))).toBe("");
});
