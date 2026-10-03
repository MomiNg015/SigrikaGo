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
    await page.getByRole("button", { name: "观战" }).click();
    const watchDialog = page.getByRole("dialog", { name: "对局列表" });
    await expect(watchDialog).toBeVisible();
    const watchModeTabContract = await readModeTabContract(watchDialog);
    await watchDialog.getByRole("button", { name: "关闭对局列表" }).click();
    await page.getByRole("button", { name: "打开履历" }).click();
    const resumeDialog = page.getByRole("dialog", { name: "履历" });
    await expect(resumeDialog).toBeVisible();
    await expect(resumeDialog.getByRole("tab")).toHaveText(["星炬", "标准", "五子棋"]);
    await expect(resumeDialog.getByLabel("履历操作").getByRole("button")).toHaveCount(2);
    await expect(resumeDialog.getByLabel("履历操作").getByRole("button", { name: "成就", exact: true })).toBeVisible();
    await expect(resumeDialog.getByLabel("履历操作").getByRole("button", { name: "个性化", exact: true })).toBeVisible();
    await expect(resumeDialog.getByRole("button", { name: /点赞|加好友|举报/u })).toHaveCount(0);

    await inspectProfileAtViewports(page, resumeDialog, viewports, testInfo, "self", watchModeTabContract);
    await resumeDialog.getByRole("button", { name: "关闭履历" }).click();

    await page.getByRole("button", { name: "好友" }).click();
    await expect(page.getByRole("heading", { name: "社交系统" })).toBeVisible();
    await page.getByRole("textbox", { name: "搜索用户名" }).fill(targetAuth.user.username);
    await page.getByRole("button", { name: "搜索用户" }).click();

    const socialDialog = page.getByRole("dialog", { name: "详细资料" });
    await expect(socialDialog).toBeVisible({ timeout: 20_000 });
    await expect(socialDialog.getByRole("tab")).toHaveText(["星炬", "标准", "五子棋"]);
    const socialActions = socialDialog.getByLabel("用户互动");
    await expect(socialActions.getByRole("button")).toHaveCount(4);
    await expect(socialActions.getByRole("button")).toHaveText(["0", "", "", ""]);
    expect(await socialActions.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.className))).toEqual([
      "profile-like-button",
      "profile-friend-button",
      "profile-blacklist-button",
      "profile-report-button"
    ]);
    await expect(socialDialog.getByRole("button", { name: "个性化" })).toHaveCount(0);
    await expect(socialDialog.getByRole("button", { name: "加入黑名单" })).toBeVisible();
    await socialDialog.getByRole("tab", { name: "标准" }).click();
    await expect(socialDialog.getByRole("rowheader")).toHaveText([
      "爱弥斯", "西格莉卡", "达妮娅", "琳奈", "莫宁", "千咲", "长离", "仇远", "娜波摩", "猪小仙"
    ]);

    await inspectProfileAtViewports(page, socialDialog, viewports, testInfo, "social", watchModeTabContract);
    await inspectStandaloneReplay(page, socialDialog, testInfo);
  } finally {
    await targetContext.close();
  }
});

async function inspectProfileAtViewports(page, dialog, viewports, testInfo, context, watchModeTabContract) {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(dialog).toBeVisible();
    // Current campus tabs are vertical bookmark rails and identity actions are icons.
    // Keep viewport, scrolling, data, keyboard and recovery gates independent of old paint.
    const tabs = dialog.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    const geometry = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const rail = element.querySelector('[role="tablist"]');
      const tableScroll = element.querySelector(".profile-character-table-scroll");
      const portrait = element.querySelector(".profile-hero-portrait .profile-portrait-mask");
      const image = portrait?.querySelector("img");
      const controls = [...element.querySelectorAll("button")].filter((button) => !button.closest('[role="tablist"]'));
      return {
        dialog: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        overflow: document.documentElement.scrollWidth - innerWidth,
        tableOverflow: tableScroll ? tableScroll.scrollWidth - tableScroll.clientWidth : 0,
        portraitOverflow: portrait ? getComputedStyle(portrait).overflow : "",
        portraitFit: image ? getComputedStyle(image).objectFit : "",
        portraitLoaded: image?.complete && image.naturalWidth > 0,
        railOrientation: rail?.getAttribute("aria-orientation"),
        railClass: rail?.className,
        tabs: [...rail.querySelectorAll('[role="tab"]')].map((tab) => ({
          backgroundColor: getComputedStyle(tab).backgroundColor,
          borderWidth: getComputedStyle(tab).borderTopWidth,
          borderRadius: getComputedStyle(tab).borderRadius,
          boxShadow: getComputedStyle(tab).boxShadow,
          minHeight: Number.parseFloat(getComputedStyle(tab).minHeight),
          selected: tab.getAttribute("aria-selected") === "true"
        })),
        gap: Number.parseFloat(getComputedStyle(rail).columnGap),
        unlabelledControls: controls.filter((button) => !button.textContent.trim() && !button.getAttribute("aria-label") && !button.title).length,
        rows: [...element.querySelectorAll(".profile-character-table tbody tr")].map((row) => ({
          headers: row.querySelectorAll("th").length,
          cells: row.querySelectorAll("td").length,
          name: row.querySelector("th")?.textContent.trim(),
          nowrap: [...row.querySelectorAll("td")].every((cell) => getComputedStyle(cell).whiteSpace === "nowrap")
        }))
      };
    });
    expect(geometry.dialog.left).toBeGreaterThanOrEqual(0);
    expect(geometry.dialog.top).toBeGreaterThanOrEqual(0);
    expect(geometry.dialog.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.dialog.bottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.tableOverflow).toBeLessThanOrEqual(1);
    expect(geometry.portraitOverflow).toBe("hidden");
    expect(geometry.portraitFit).toBe("contain");
    expect(geometry.portraitLoaded).toBe(true);
    expect(geometry.railOrientation).toBe("vertical");
    expect(geometry.railClass).toContain("window-bookmark-rail");
    expect(geometry.unlabelledControls).toBe(0);
    expect(geometry.rows.length).toBe(10);
    expect(geometry.rows.every((row) => row.headers === 1 && row.cells === 5 && row.name && row.nowrap)).toBe(true);
    expect({ gap: geometry.gap, active: geometry.tabs.find((tab) => tab.selected), inactive: geometry.tabs.find((tab) => !tab.selected) }).toEqual(watchModeTabContract);
    const activeTab = dialog.locator('[role="tab"][aria-selected="true"]');
    await activeTab.focus();
    await page.keyboard.press("ArrowDown");
    await expect(dialog.locator('[role="tab"][aria-selected="true"]')).toBeFocused();
    await tabs.getByText(context === "self" ? "星炬" : "标准", { exact: true }).click();
    const panel = dialog.getByRole("tabpanel");
    await expect(panel).toHaveAttribute("aria-labelledby", context === "self" ? "self-profile-tab-spark" : "social-profile-tab-standard");
    await dialog.locator(".profile-character-table tbody tr").last().scrollIntoViewIfNeeded();
    await expect(dialog.locator(".profile-character-table tbody tr").last()).toBeInViewport();
    const close = dialog.getByRole("button", { name: context === "self" ? "关闭履历" : "关闭详细资料" });
    await expect(close).toBeInViewport();
    const help = dialog.getByLabel("段位说明");
    await help.focus();
    await expect(help.getByRole("tooltip")).toHaveCSS("opacity", "1");
    const tooltip = await help.getByRole("tooltip").boundingBox();
    expect(tooltip.width).toBeGreaterThan(0);
    expect(tooltip.x).toBeGreaterThanOrEqual(0);
    expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(viewport.width + 1);
    await help.blur();
    await page.screenshot({ path: testInfo.outputPath(`${context}-profile-${viewport.width}x${viewport.height}.png`), fullPage: false });
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

async function readModeTabContract(dialog) {
  return dialog.evaluate((element) => {
    const tabList = element.querySelector('[role="tablist"][aria-label="对弈模式"]');
    const tabs = [...tabList.querySelectorAll("[role='tab']")];
    const readTab = (tab) => ({
      backgroundColor: getComputedStyle(tab).backgroundColor,
      borderWidth: getComputedStyle(tab).borderTopWidth,
      borderRadius: getComputedStyle(tab).borderRadius,
      boxShadow: getComputedStyle(tab).boxShadow,
      minHeight: Number.parseFloat(getComputedStyle(tab).minHeight),
      selected: tab.getAttribute("aria-selected") === "true"
    });
    return {
      gap: Number.parseFloat(getComputedStyle(tabList).columnGap),
      active: readTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true")),
      inactive: readTab(tabs.find((tab) => tab.getAttribute("aria-selected") !== "true"))
    };
  });
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
          characterStats: PROFILE_CHARACTER_STATS,
          achievementEquipmentAssets: {
            ...(user.achievementEquipmentAssets ?? {}),
            nameplate: {
              id: "profile-stability-nameplate",
              imageUrl: "/assets/achievements/semantic-nameplate.png"
            }
          }
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
