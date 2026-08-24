import { expect, test } from "@playwright/test";
import { createStabilityBrowserContext, registerPlayer } from "./helpers.js";

const PROFILE_VIEWPORTS = {
  "desktop-chromium": [
    { width: 1440, height: 768 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 }
  ],
  "mobile-chromium": [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 }
  ]
};

test("keeps self and social dossiers usable at the supported profile viewports", async ({ browser, page }, testInfo) => {
  test.setTimeout(120_000);
  const viewports = PROFILE_VIEWPORTS[testInfo.project.name];
  expect(viewports).toBeTruthy();
  await page.setViewportSize(viewports[0]);

  const targetContext = await createStabilityBrowserContext(browser);
  try {
    const selfAuth = await registerPlayer(page.context(), "pr", { characterId: "sigrika" });
    const targetAuth = await registerPlayer(targetContext, "ps", { characterId: "aemeath" });
    await routeProfileFixture(page, selfAuth.user, "spark");
    await routeProfileFixture(page, targetAuth.user, "standard");
    await routeProfileReplayFixture(page, targetAuth.user, "standard");
    await page.goto("/");

    await expect(page.getByRole("button", { name: "打开履历" })).toBeVisible({ timeout: 45_000 });
    const skipOnboarding = page.getByRole("button", { name: "快进并跳过引导" });
    await skipOnboarding.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    if (await skipOnboarding.isVisible().catch(() => false)) {
      await skipOnboarding.click({ force: true });
      const confirmSkip = page.getByRole("button", { name: "确认跳过" });
      await expect(confirmSkip).toBeVisible();
      await confirmSkip.click({ force: true });
      await expect(page.getByRole("region", { name: "新手引导" })).toHaveCount(0);
    }
    await page.getByRole("button", { name: "打开履历" }).click();
    const resumeDialog = page.getByRole("dialog", { name: "履历" });
    await expect(resumeDialog).toBeVisible();
    await expect(resumeDialog.getByRole("tab")).toHaveText(["星炬", "标准", "五子棋"]);
    await expect(resumeDialog.getByLabel("履历操作").getByRole("button")).toHaveText(["个性化"]);
    await expect(resumeDialog.getByRole("button", { name: /点赞|加好友|举报/u })).toHaveCount(0);

    await inspectProfileAtViewports(page, resumeDialog, viewports, testInfo, "self");
    await resumeDialog.getByRole("button", { name: "关闭履历" }).click();

    await page.getByRole("button", { name: "好友" }).click();
    await expect(page.getByRole("heading", { name: "社交系统" })).toBeVisible();
    await page.getByRole("textbox", { name: "搜索用户名" }).fill(targetAuth.user.username);
    await page.getByRole("button", { name: "搜索用户" }).click();

    const socialDialog = page.getByRole("dialog", { name: "详细资料" });
    await expect(socialDialog).toBeVisible({ timeout: 20_000 });
    await expect(socialDialog.getByRole("tab")).toHaveText(["星炬", "标准", "五子棋"]);
    const socialActions = socialDialog.getByLabel("用户互动");
    await expect(socialActions.getByRole("button")).toHaveText([/点赞 0/u, "加好友", "举报"]);
    await expect(socialDialog.getByRole("button", { name: "个性化" })).toHaveCount(0);
    await expect(socialDialog.getByRole("button", { name: "加入黑名单" })).toBeVisible();
    await socialDialog.getByRole("tab", { name: "标准" }).click();
    await expect(socialDialog.getByRole("rowheader")).toHaveText([
      "爱弥斯", "西格莉卡", "达妮娅", "琳奈", "莫宁", "千咲", "长离", "仇远", "娜波摩", "猪小仙"
    ]);

    await inspectProfileAtViewports(page, socialDialog, viewports, testInfo, "social");
    await inspectStandaloneReplay(page, socialDialog, testInfo);
  } finally {
    await targetContext.close();
  }
});

async function inspectProfileAtViewports(page, dialog, viewports, testInfo, context) {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(dialog).toBeVisible();

    const geometry = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const dossier = element.querySelector(".profile-resume-view");
      const panel = element.querySelector(".profile-record-panel");
      const tableScroll = element.querySelector(".profile-character-table-scroll");
      const portraitMask = element.querySelector(".profile-hero-portrait > .profile-portrait-mask");
      const portraitImage = portraitMask?.querySelector("img");
      const footer = element.querySelector(".profile-secondary-actions");
      const profileHeader = element.querySelector(".profile-modal-header");
      const profileTitle = profileHeader?.querySelector("h2");
      const profileClose = profileHeader?.querySelector(":scope > .close-button");
      const transparentSurfaceSelectors = [
        ".profile-resume-view",
        ".profile-record-panel",
        ".profile-resume-hero",
        ".profile-mode-tabs",
        ".profile-overview-grid",
        ".profile-recent-section",
        ".profile-character-section"
      ];
      const recordRows = [...element.querySelectorAll(".profile-character-table tbody tr:not(.profile-character-empty-row)")]
        .map((row) => {
          const style = getComputedStyle(row);
          const metricCell = row.querySelector("td");
          const cellStyle = metricCell ? getComputedStyle(metricCell) : null;
          const name = row.querySelector(".profile-character-name");
          const cells = [...row.querySelectorAll(":scope > th, :scope > td")].map((cell) => cell.getBoundingClientRect());
          return {
            height: row.getBoundingClientRect().height,
            display: style.display,
            clipPath: style.clipPath,
            boxShadow: style.boxShadow,
            fontFamily: style.fontFamily,
            cellPaddingTop: cellStyle ? Number.parseFloat(cellStyle.paddingTop) : 0,
            cellsOnOneLine: cells.length === 6 && Math.max(...cells.map((cell) => cell.top)) - Math.min(...cells.map((cell) => cell.top)) <= 1,
            cellsNoWrap: [...row.querySelectorAll(":scope > th, :scope > td")].every((cell) => getComputedStyle(cell).whiteSpace === "nowrap"),
            nameWidth: name?.getBoundingClientRect().width ?? 0,
            nameScrollWidth: name?.scrollWidth ?? 0
          };
        });
      const recordMasks = [...element.querySelectorAll(".profile-character-table .profile-portrait-mask")]
        .map((mask) => {
          const rect = mask.getBoundingClientRect();
          const imageRect = mask.querySelector("img")?.getBoundingClientRect();
          const imageStyle = mask.querySelector("img") ? getComputedStyle(mask.querySelector("img")) : null;
          const outerRect = mask.parentElement?.getBoundingClientRect();
          const rowHeaderRect = mask.closest("th")?.getBoundingClientRect();
          const style = getComputedStyle(mask);
          return {
            width: rect.width,
            height: rect.height,
            imageWidth: imageRect?.width ?? 0,
            imageHeight: imageRect?.height ?? 0,
            imageCenterOffsetX: imageRect ? Math.abs((imageRect.left + imageRect.width / 2) - (rect.left + rect.width / 2)) : Infinity,
            imageCenterOffsetY: imageRect ? Math.abs((imageRect.top + imageRect.height / 2) - (rect.top + rect.height / 2)) : Infinity,
            outerHeight: outerRect?.height ?? 0,
            rowHeaderHeight: rowHeaderRect?.height ?? 0,
            maskTop: rect.top,
            rowHeaderTop: rowHeaderRect?.top ?? 0,
            overflow: style.overflow,
            backgroundColor: style.backgroundColor,
            borderWidth: Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderRightWidth)
              + Number.parseFloat(style.borderBottomWidth) + Number.parseFloat(style.borderLeftWidth),
            imageObjectFit: imageStyle?.objectFit ?? ""
          };
        });
      const summary = [...element.querySelectorAll(".profile-summary-item")].map((item) => {
        const itemRect = item.getBoundingClientRect();
        return { left: itemRect.left, top: itemRect.top };
      });
      let bottomContentVisible = true;
      let footerVisible = true;
      let footerVisibleAfterTableScroll = true;
      if (panel?.lastElementChild) {
        const previousScrollTop = panel.scrollTop;
        panel.scrollTop = panel.scrollHeight;
        const panelRect = panel.getBoundingClientRect();
        const lastRect = panel.lastElementChild.getBoundingClientRect();
        bottomContentVisible = lastRect.bottom <= panelRect.bottom + 1;
        const footerRect = footer?.getBoundingClientRect();
        footerVisible = !footerRect || (footerRect.top >= panelRect.top - 1 && footerRect.bottom <= panelRect.bottom + 1);
        panel.scrollTop = previousScrollTop;
      }
      if (tableScroll && footer) {
        const previousScrollTop = tableScroll.scrollTop;
        tableScroll.scrollTop = tableScroll.scrollHeight;
        const panelRect = panel.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        footerVisibleAfterTableScroll = footerRect.top >= panelRect.top - 1 && footerRect.bottom <= panelRect.bottom + 1;
        tableScroll.scrollTop = previousScrollTop;
      }
      return {
        dialog: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        dossierWidth: dossier?.getBoundingClientRect().width ?? 0,
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        panelOverflowY: panel ? getComputedStyle(panel).overflowY : "",
        portraitMaskOverflow: portraitMask ? getComputedStyle(portraitMask).overflow : "",
        portraitImageRatio: portraitMask && portraitImage
          ? portraitImage.getBoundingClientRect().width / portraitMask.getBoundingClientRect().width
          : 0,
        portraitImageCenterOffsetX: portraitMask && portraitImage
          ? Math.abs(
              (portraitImage.getBoundingClientRect().left + portraitImage.getBoundingClientRect().width / 2)
              - (portraitMask.getBoundingClientRect().left + portraitMask.getBoundingClientRect().width / 2)
            )
          : Infinity,
        portraitImageCenterOffsetY: portraitMask && portraitImage
          ? Math.abs(
              (portraitImage.getBoundingClientRect().top + portraitImage.getBoundingClientRect().height / 2)
              - (portraitMask.getBoundingClientRect().top + portraitMask.getBoundingClientRect().height / 2)
            )
          : Infinity,
        replayInRecentHeading: Boolean(element.querySelector(".profile-recent-section .profile-section-heading .profile-replay-button")),
        replayInFooter: Boolean(element.querySelector(".profile-secondary-actions .profile-replay-button")),
        footerText: footer?.textContent ?? "",
        headerAlignment: profileTitle && profileClose ? {
          topDifference: Math.abs(profileTitle.getBoundingClientRect().top - profileClose.getBoundingClientRect().top),
          centerDifference: Math.abs(
            (profileTitle.getBoundingClientRect().top + profileTitle.getBoundingClientRect().height / 2)
            - (profileClose.getBoundingClientRect().top + profileClose.getBoundingClientRect().height / 2)
          )
        } : null,
        transparentSurfaces: transparentSurfaceSelectors.map((selector) => ({
          selector,
          backgroundColor: getComputedStyle(element.querySelector(selector)).backgroundColor
        })),
        tableOverflow: tableScroll ? tableScroll.scrollWidth - tableScroll.clientWidth : 0,
        tableScrollRange: tableScroll ? tableScroll.scrollHeight - tableScroll.clientHeight : 0,
        tableMetrics: tableScroll ? {
          clientWidth: tableScroll.clientWidth,
          scrollWidth: tableScroll.scrollWidth,
          rectWidth: tableScroll.getBoundingClientRect().width,
          tableWidth: tableScroll.querySelector("table")?.getBoundingClientRect().width ?? 0,
          paddingLeft: getComputedStyle(tableScroll).paddingLeft,
          paddingRight: getComputedStyle(tableScroll).paddingRight,
          scrollbarGutter: getComputedStyle(tableScroll).scrollbarGutter,
          overflowOwners: [...tableScroll.querySelectorAll("*")]
            .map((node) => ({
              name: `${node.tagName.toLowerCase()}.${node.className || ""}`,
              right: node.getBoundingClientRect().right - tableScroll.getBoundingClientRect().right,
              scrollWidth: node.scrollWidth,
              clientWidth: node.clientWidth
            }))
            .filter((entry) => entry.right > 1 || entry.scrollWidth - entry.clientWidth > 1)
            .slice(-8)
        } : null,
        bottomContentVisible,
        footerVisible,
        footerVisibleAfterTableScroll,
        recordRows,
        recordMasks,
        summary
      };
    });

    expect(geometry.dialog.left).toBeGreaterThanOrEqual(0);
    expect(geometry.dialog.top).toBeGreaterThanOrEqual(0);
    expect(geometry.dialog.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.dialog.bottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
    expect(geometry.tableOverflow, JSON.stringify(geometry.tableMetrics)).toBeLessThanOrEqual(1);
    expect(geometry.portraitMaskOverflow).toBe("hidden");
    expect(geometry.portraitImageRatio).toBeGreaterThanOrEqual(0.68);
    expect(geometry.portraitImageRatio).toBeLessThanOrEqual(0.72);
    expect(geometry.portraitImageCenterOffsetX).toBeLessThanOrEqual(1);
    expect(geometry.portraitImageCenterOffsetY).toBeLessThanOrEqual(1);
    expect(geometry.replayInRecentHeading).toBe(true);
    expect(geometry.replayInFooter).toBe(false);
    expect(geometry.footerText).not.toContain("关系操作");
    expect(geometry.transparentSurfaces.every((surface) => surface.backgroundColor === "rgba(0, 0, 0, 0)"), JSON.stringify(geometry.transparentSurfaces)).toBe(true);
    expect(geometry.bottomContentVisible).toBe(true);
    expect(geometry.footerVisible).toBe(true);
    expect(geometry.recordRows.length).toBeGreaterThan(0);
    expect(geometry.recordRows.every((row) => row.height >= 58)).toBe(true);
    expect(geometry.recordRows.every((row) => row.clipPath === "none" && row.boxShadow === "none")).toBe(true);
    expect(geometry.recordRows.every((row) => !/Cascadia|Consolas|monospace/iu.test(row.fontFamily))).toBe(true);
    expect(geometry.recordRows.every((row) => row.cellPaddingTop >= 7)).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.overflow === "hidden")).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.backgroundColor === "rgba(0, 0, 0, 0)" && mask.borderWidth === 0)).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.imageObjectFit === "contain")).toBe(true);
    expect(
      geometry.recordMasks.every((mask) => (
        mask.width >= 40
        && mask.height >= 40
        && mask.imageWidth / mask.width >= 0.76
        && mask.imageWidth / mask.width <= 0.82
        && mask.imageHeight / mask.height >= 0.76
        && mask.imageHeight / mask.height <= 0.82
        && mask.imageCenterOffsetX <= 1
        && mask.imageCenterOffsetY <= 1
        && mask.rowHeaderHeight >= 46
        && mask.maskTop >= mask.rowHeaderTop - 1
      )),
      JSON.stringify(geometry.recordMasks)
    ).toBe(true);

    if (testInfo.project.name === "desktop-chromium") {
      expect(geometry.dossierWidth).toBeGreaterThanOrEqual(1080);
      expect(geometry.dossierWidth).toBeLessThanOrEqual(1161);
      expect(geometry.recordRows.every((row) => row.nameWidth + 1 >= row.nameScrollWidth)).toBe(true);
      expect(geometry.tableScrollRange).toBeGreaterThan(0);
      expect(geometry.footerVisibleAfterTableScroll).toBe(true);
    } else {
      expect(geometry.dossierWidth).toBeLessThanOrEqual(viewport.width);
      expect(geometry.panelOverflowY).toBe("auto");
      expect(Math.abs(geometry.summary[0].top - geometry.summary[1].top)).toBeLessThanOrEqual(1);
      expect(geometry.summary[2].top).toBeGreaterThan(geometry.summary[0].top);
      expect(Math.abs(geometry.summary[2].top - geometry.summary[3].top)).toBeLessThanOrEqual(1);
      expect(geometry.recordRows.every((row) => row.display === "table-row")).toBe(true);
      expect(geometry.recordRows.every((row) => row.cellsOnOneLine && row.cellsNoWrap)).toBe(true);
      expect(geometry.recordRows.every((row) => row.height <= 64)).toBe(true);
    }

    if (context === "social") {
      expect(geometry.headerAlignment?.topDifference ?? Infinity).toBeLessThanOrEqual(1);
      expect(geometry.headerAlignment?.centerDifference ?? Infinity).toBeLessThanOrEqual(1);
    }

    if ((viewport.width === 1440 && context === "self") || (viewport.width === 390 && context === "social")) {
      await page.locator(".toast").waitFor({ state: "detached", timeout: 10_000 }).catch(() => {});
      await page.screenshot({ path: testInfo.outputPath(`${context}-${viewport.width}x${viewport.height}.png`), fullPage: false });
      if (viewport.width === 390 && context === "social") {
        const panel = dialog.locator(".profile-record-panel");
        await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
        await page.screenshot({ path: testInfo.outputPath(`${context}-${viewport.width}x${viewport.height}-bottom.png`), fullPage: false });
        await panel.evaluate((element) => { element.scrollTop = 0; });
      }
    }
  }
}

async function inspectStandaloneReplay(page, socialDialog, testInfo) {
  const viewport = testInfo.project.name === "desktop-chromium"
    ? { width: 1440, height: 768 }
    : { width: 390, height: 844 };
  await page.setViewportSize(viewport);
  await socialDialog.getByRole("button", { name: "对局回放" }).click();

  const replayDialog = page.getByRole("dialog", { name: "对局回放" });
  await expect(replayDialog).toBeVisible();
  const placement = await replayDialog.evaluate((element) => ({
    insideProfile: Boolean(element.closest(".user-profile-modal")),
    portalParentIsAppShell: element.parentElement?.parentElement?.classList.contains("app-shell") ?? false,
    backdropClass: element.parentElement?.className ?? "",
    zIndex: Number.parseInt(getComputedStyle(element.parentElement).zIndex, 10)
  }));
  expect(placement.insideProfile).toBe(false);
  expect(placement.portalParentIsAppShell).toBe(true);
  expect(placement.backdropClass).toContain("standalone-replay-backdrop");
  expect(placement.zIndex).toBeGreaterThan(160);
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath(`social-replay-${viewport.width}x${viewport.height}.png`), fullPage: false });

  await replayDialog.getByRole("button", { name: "关闭对局回放" }).click();
  await expect(replayDialog).toHaveCount(0);
  await expect(socialDialog).toBeVisible();
}

async function routeProfileFixture(page, user, mode) {
  await page.route(`**/api/users/${user.id}/profile?mode=${mode}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          ...user,
          mode,
          rank: mode === "standard" ? "4段" : "5段",
          rating: mode === "standard" ? 1286 : 1368,
          recentResults: ["win", "loss", "win", "win", "draw", "loss", "win", "win", "loss", "win"],
          recordStats: { totalGames: 38, wins: 24, losses: 11, draws: 3 },
          characterStats: PROFILE_CHARACTER_STATS
        }
      })
    });
  });
}

async function routeProfileReplayFixture(page, user, mode) {
  await page.route(`**/api/users/${user.id}/replays?mode=${mode}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ records: [], nextCursor: null })
    });
  });
}

const PROFILE_CHARACTER_STATS = [
  { characterId: "aemeath", total: 21, wins: 15, losses: 5, draws: 1, winRate: "71.4%" },
  { characterId: "sigrika", total: 17, wins: 9, losses: 6, draws: 2, winRate: "52.9%" },
  { characterId: "denia", total: 15, wins: 8, losses: 6, draws: 1, winRate: "53.3%" },
  { characterId: "lynae", total: 13, wins: 7, losses: 5, draws: 1, winRate: "53.8%" },
  { characterId: "mornye", total: 12, wins: 7, losses: 4, draws: 1, winRate: "58.3%" },
  { characterId: "chisa", total: 10, wins: 5, losses: 4, draws: 1, winRate: "50.0%" },
  { characterId: "changli", total: 9, wins: 5, losses: 4, draws: 0, winRate: "55.6%" },
  { characterId: "qiuyuan", total: 8, wins: 4, losses: 3, draws: 1, winRate: "50.0%" },
  { characterId: "nabomo", total: 7, wins: 4, losses: 3, draws: 0, winRate: "57.1%" },
  { characterId: "baconbits", total: 6, wins: 3, losses: 3, draws: 0, winRate: "50.0%" }
];
