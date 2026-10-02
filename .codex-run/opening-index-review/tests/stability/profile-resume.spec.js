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
    await expect(resumeDialog.getByLabel("履历操作").getByRole("button")).toHaveText(["个性化"]);
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
    await page.waitForTimeout(250);

    const geometry = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const dossier = element.querySelector(".profile-resume-view");
      const panel = element.querySelector(".profile-record-panel");
      const tableScroll = element.querySelector(".profile-character-table-scroll");
      const portraitMask = element.querySelector(".profile-hero-portrait > .profile-portrait-mask");
      const portraitImage = portraitMask?.querySelector("img");
      const modeTabList = element.querySelector(".profile-mode-tabs");
      const modeTabs = [...element.querySelectorAll(".profile-mode-tabs [role='tab']")];
      const footer = element.querySelector(".profile-secondary-actions");
      const profileHeader = element.querySelector(".profile-modal-header");
      const profileTitle = profileHeader?.querySelector("h2");
      const profileClose = profileHeader?.querySelector(":scope > .close-button");
      const dossierClose = profileClose ?? element.querySelector(".resume-close-button");
      const identity = element.querySelector(".profile-identity-block .user-identity");
      const identityHeading = element.querySelector(".profile-identity-block h3");
      const identityNameTag = identity?.querySelector(".user-identity-name-tag");
      const identityNameplateBackground = identity?.querySelector(".user-identity-nameplate-background");
      const hero = element.querySelector(".profile-resume-hero");
      const transparentSurfaceSelectors = [
        ".profile-resume-view",
        ".profile-record-panel",
        ".profile-mode-tabs",
        ".profile-overview-grid"
      ];
      const cardSurfaceSelectors = [
        ".profile-resume-hero",
        ".profile-summary-item",
        ".profile-recent-section",
        ".profile-character-section"
      ];
      const visualTableHead = element.querySelector(".profile-character-table-head");
      const semanticTableHead = element.querySelector(".profile-character-table thead th");
      const visualTableColumns = [...(visualTableHead?.children ?? [])].map((cell) => cell.getBoundingClientRect());
      const firstRecordCells = [...(element.querySelector(".profile-character-table tbody tr:not(.profile-character-empty-row)")
        ?.querySelectorAll(":scope > th, :scope > td") ?? [])].map((cell) => cell.getBoundingClientRect());
      const tableColumnAlignment = visualTableColumns.length === 6 && firstRecordCells.length === 6
        ? Math.max(...visualTableColumns.flatMap((cell, index) => [
            Math.abs(cell.left - firstRecordCells[index].left),
            Math.abs(cell.right - firstRecordCells[index].right)
          ]))
        : Infinity;
      const firstColumnShare = firstRecordCells.length === 6
        ? firstRecordCells[0].width / firstRecordCells.reduce((width, cell) => width + cell.width, 0)
        : 0;
      const achievementAction = element.querySelector(".achievement-entry-action");
      const wallet = element.querySelector(".resume-wallet");
      const personalizationAction = element.querySelector(".profile-personalization-button");
      const replayAction = element.querySelector(".profile-replay-button");
      const likeAction = element.querySelector(".profile-like-button");
      const friendAction = element.querySelector(".profile-friend-button");
      const blacklistAction = element.querySelector(".profile-blacklist-button");
      const reportAction = element.querySelector(".profile-report-button");
      const controlStyles = Object.fromEntries([
        ["achievement", achievementAction],
        ["wallet", wallet],
        ["personalization", personalizationAction],
        ["replay", replayAction],
        ["like", likeAction],
        ["friend", friendAction],
        ["blacklist", blacklistAction],
        ["report", reportAction]
      ].map(([name, control]) => [name, control ? {
        backgroundColor: getComputedStyle(control).backgroundColor,
        backgroundImage: getComputedStyle(control).backgroundImage,
        iconFilter: control.querySelector("svg") ? getComputedStyle(control.querySelector("svg")).filter : "",
        text: control.textContent,
        width: control.getBoundingClientRect().width,
        iconWidth: control.querySelector("svg")?.getBoundingClientRect().width ?? 0,
        iconHeight: control.querySelector("svg")?.getBoundingClientRect().height ?? 0
      } : null]));
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
            cellBoxShadow: cellStyle?.boxShadow ?? "none",
            cellBackgroundColor: cellStyle?.backgroundColor ?? "rgba(0, 0, 0, 0)",
            cellBorderWidth: cellStyle
              ? Number.parseFloat(cellStyle.borderTopWidth) + Number.parseFloat(cellStyle.borderBottomWidth)
              : 0,
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
      const overviewRect = element.querySelector(".profile-overview-grid")?.getBoundingClientRect();
      const summaryGridRect = element.querySelector(".profile-summary-grid")?.getBoundingClientRect();
      const recentSectionRect = element.querySelector(".profile-recent-section")?.getBoundingClientRect();
      const characterSectionRect = element.querySelector(".profile-character-section")?.getBoundingClientRect();
      const heroRect = hero?.getBoundingClientRect();
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
        panelScrollRange: panel ? panel.scrollHeight - panel.clientHeight : Infinity,
        portraitMaskOverflow: portraitMask ? getComputedStyle(portraitMask).overflow : "",
        portraitImageObjectFit: portraitImage ? getComputedStyle(portraitImage).objectFit : "",
        portraitImageRatio: portraitMask && portraitImage
          ? portraitImage.getBoundingClientRect().width / portraitMask.clientWidth
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
        modeTabListTransparent: modeTabList ? getComputedStyle(modeTabList).backgroundColor === "rgba(0, 0, 0, 0)" : false,
        modeTabListGap: modeTabList ? Number.parseFloat(getComputedStyle(modeTabList).columnGap) : Infinity,
        modeTabListUsesSharedWindowClass: modeTabList?.classList.contains("window-mode-tabs") ?? false,
        modeTabStyles: modeTabs.map((tab) => ({
          backgroundColor: getComputedStyle(tab).backgroundColor,
          borderWidth: getComputedStyle(tab).borderTopWidth,
          borderRadius: getComputedStyle(tab).borderRadius,
          boxShadow: getComputedStyle(tab).boxShadow,
          minHeight: Number.parseFloat(getComputedStyle(tab).minHeight),
          selected: tab.getAttribute("aria-selected") === "true"
        })),
        modeTabsInsideDossier: dossier && modeTabs.length === 3
          ? modeTabs.every((tab) => {
              const tabRect = tab.getBoundingClientRect();
              const dossierRect = dossier.getBoundingClientRect();
              return tabRect.left >= dossierRect.left - 1 && tabRect.right <= dossierRect.right + 1;
            })
          : false,
        modeTabsOnOneLine: modeTabs.length === 3
          ? Math.max(...modeTabs.map((tab) => tab.offsetTop))
            - Math.min(...modeTabs.map((tab) => tab.offsetTop)) <= 1
          : false,
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
        closeStyle: dossierClose ? {
          width: dossierClose.getBoundingClientRect().width,
          height: dossierClose.getBoundingClientRect().height,
          backgroundColor: getComputedStyle(dossierClose).backgroundColor,
          borderWidth: Number.parseFloat(getComputedStyle(dossierClose).borderTopWidth),
          borderRadius: getComputedStyle(dossierClose).borderRadius,
          boxShadow: getComputedStyle(dossierClose).boxShadow
        } : null,
        identityGeometry: identity && identityHeading && hero ? (() => {
          const identityRect = identity.getBoundingClientRect();
          const headingRect = identityHeading.getBoundingClientRect();
          const heroRect = hero.getBoundingClientRect();
          const portraitRect = portraitMask?.getBoundingClientRect();
          const tagRect = identityNameTag?.getBoundingClientRect();
          const backgroundRect = identityNameplateBackground?.getBoundingClientRect();
          return {
            scale: getComputedStyle(identity).getPropertyValue("--user-nameplate-scale").trim(),
            headingFontSize: Number.parseFloat(getComputedStyle(identityHeading).fontSize),
            left: identityRect.left,
            right: identityRect.right,
            top: identityRect.top,
            bottom: identityRect.bottom,
            heroLeft: heroRect.left,
            heroRight: heroRect.right,
            portraitTop: portraitRect?.top ?? 0,
            portraitBottom: portraitRect?.bottom ?? 0,
            hasNameplate: identity.classList.contains("has-nameplate"),
            tagWidth: tagRect?.width ?? 0,
            tagHeight: tagRect?.height ?? 0,
            backgroundWidth: backgroundRect?.width ?? 0,
            backgroundHeight: backgroundRect?.height ?? 0,
            headingWidth: headingRect.width
          };
        })() : null,
        friendWidth: friendAction?.getBoundingClientRect().width ?? 0,
        transparentSurfaces: transparentSurfaceSelectors.map((selector) => ({
          selector,
          backgroundColor: getComputedStyle(element.querySelector(selector)).backgroundColor
        })),
        cardSurfaces: cardSurfaceSelectors.flatMap((selector) => [...element.querySelectorAll(selector)].map((surface) => ({
          selector,
          backgroundColor: getComputedStyle(surface).backgroundColor,
          borderWidth: Number.parseFloat(getComputedStyle(surface).borderTopWidth),
          boxShadow: getComputedStyle(surface).boxShadow
        }))),
        visualTableHead: visualTableHead ? {
          display: getComputedStyle(visualTableHead).display,
          backgroundColor: getComputedStyle(visualTableHead).backgroundColor,
          borderWidth: Number.parseFloat(getComputedStyle(visualTableHead).borderTopWidth),
          boxShadow: getComputedStyle(visualTableHead).boxShadow,
          overflowY: getComputedStyle(visualTableHead).overflowY,
          scrollRange: visualTableHead.scrollHeight - visualTableHead.clientHeight,
          firstLabel: visualTableHead.firstElementChild?.textContent ?? "missing",
          baselineDifference: visualTableHead.children.length > 0
            ? Math.max(...[...visualTableHead.children].map((child) => child.getBoundingClientRect().bottom))
              - Math.min(...[...visualTableHead.children].map((child) => child.getBoundingClientRect().bottom))
            : Infinity,
          bottom: visualTableHead.getBoundingClientRect().bottom,
          scrollTop: tableScroll?.getBoundingClientRect().top ?? 0
        } : null,
        semanticTableHeadPosition: semanticTableHead ? getComputedStyle(semanticTableHead).position : "",
        tableColumnAlignment,
        firstColumnShare,
        controlStyles,
        tableOverflow: tableScroll ? tableScroll.scrollWidth - tableScroll.clientWidth : 0,
        tableOverflowY: tableScroll ? getComputedStyle(tableScroll).overflowY : "",
        tableScrollRange: tableScroll ? tableScroll.scrollHeight - tableScroll.clientHeight : 0,
        tableMetrics: tableScroll ? {
          clientWidth: tableScroll.clientWidth,
          clientHeight: tableScroll.clientHeight,
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
        verticalLayout: {
          heroHeight: heroRect?.height ?? 0,
          panelHeight: panel?.getBoundingClientRect().height ?? 0,
          panelScrollHeight: panel?.scrollHeight ?? 0,
          overviewHeight: overviewRect?.height ?? 0,
          summaryGridHeight: summaryGridRect?.height ?? 0,
          recentSectionHeight: recentSectionRect?.height ?? 0,
          characterSectionHeight: characterSectionRect?.height ?? 0,
          characterSectionTop: characterSectionRect?.top ?? 0,
          characterSectionBottom: characterSectionRect?.bottom ?? 0,
          panelBottom: panel?.getBoundingClientRect().bottom ?? 0
        },
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
    expect(geometry.portraitImageObjectFit).toBe("contain");
    expect(geometry.portraitImageRatio).toBeGreaterThanOrEqual(0.78);
    expect(geometry.portraitImageRatio).toBeLessThanOrEqual(0.82);
    expect(geometry.portraitImageCenterOffsetX).toBeLessThanOrEqual(1);
    expect(geometry.portraitImageCenterOffsetY).toBeLessThanOrEqual(1);
    expect(geometry.modeTabListTransparent).toBe(true);
    expect(geometry.modeTabListGap).toBe(watchModeTabContract.gap);
    expect(geometry.modeTabListUsesSharedWindowClass).toBe(true);
    expect({
      gap: geometry.modeTabListGap,
      active: geometry.modeTabStyles.find((tab) => tab.selected),
      inactive: geometry.modeTabStyles.find((tab) => !tab.selected)
    }).toEqual(watchModeTabContract);
    expect(geometry.modeTabsInsideDossier).toBe(true);
    expect(geometry.modeTabsOnOneLine).toBe(true);
    expect(geometry.replayInRecentHeading).toBe(true);
    expect(geometry.replayInFooter).toBe(false);
    expect(geometry.controlStyles.replay?.backgroundColor).toBe("rgb(228, 246, 240)");
    expect(geometry.footerText).not.toContain("关系操作");
    expect(geometry.closeStyle).toMatchObject({
      width: 44,
      height: 44,
      backgroundColor: "rgb(255, 255, 255)",
      borderWidth: 3,
      borderRadius: "14px"
    });
    expect(geometry.closeStyle?.boxShadow).not.toBe("none");
    expect(geometry.identityGeometry?.left ?? -1).toBeGreaterThanOrEqual((geometry.identityGeometry?.heroLeft ?? 0) - 1);
    expect(geometry.identityGeometry?.right ?? Infinity).toBeLessThanOrEqual((geometry.identityGeometry?.heroRight ?? 0) + 1);
    expect(geometry.transparentSurfaces.every((surface) => surface.backgroundColor === "rgba(0, 0, 0, 0)"), JSON.stringify(geometry.transparentSurfaces)).toBe(true);
    expect(geometry.cardSurfaces.every((surface) => (
      surface.backgroundColor === "rgb(255, 250, 240)"
      && surface.borderWidth >= 2
      && surface.boxShadow !== "none"
    )), JSON.stringify(geometry.cardSurfaces)).toBe(true);
    expect(geometry.bottomContentVisible, JSON.stringify(geometry.verticalLayout)).toBe(true);
    expect(geometry.footerVisible).toBe(true);
    expect(geometry.recordRows.length).toBeGreaterThan(0);
    expect(geometry.recordRows.every((row) => row.height >= 58)).toBe(true);
    expect(geometry.recordRows.every((row) => row.clipPath === "none" && row.boxShadow === "none")).toBe(true);
    expect(geometry.recordRows.every((row) => (
      row.cellBackgroundColor !== "rgba(0, 0, 0, 0)"
      && row.cellBorderWidth >= 2
      && row.cellBoxShadow !== "none"
    ))).toBe(true);
    expect(geometry.recordRows.every((row) => !/Cascadia|Consolas|monospace/iu.test(row.fontFamily))).toBe(true);
    expect(geometry.recordRows.every((row) => row.cellPaddingTop >= 7)).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.overflow === "hidden")).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.backgroundColor === "rgba(0, 0, 0, 0)" && mask.borderWidth === 0)).toBe(true);
    expect(geometry.recordMasks.every((mask) => mask.imageObjectFit === "contain")).toBe(true);
    if (context === "self") {
      expect(geometry.controlStyles.achievement?.backgroundColor).toBe("rgb(255, 228, 238)");
      expect(geometry.controlStyles.achievement?.iconFilter).toBe("none");
      expect(geometry.controlStyles.wallet?.backgroundImage).not.toBe("none");
      expect(geometry.controlStyles.wallet?.iconFilter).toBe("none");
      expect(geometry.controlStyles.personalization?.backgroundColor).toBe("rgb(217, 240, 255)");
    }
    expect(
      geometry.recordMasks.every((mask) => (
        mask.width >= 46
        && mask.height >= 46
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
      expect(geometry.identityGeometry?.scale).toBe("1.4");
      expect(geometry.identityGeometry?.headingFontSize).toBeCloseTo(37.8, 1);
      expect(geometry.dossierWidth).toBeGreaterThanOrEqual(1080);
      expect(geometry.dossierWidth).toBeLessThanOrEqual(1161);
      expect(geometry.recordRows.every((row) => row.nameWidth + 1 >= row.nameScrollWidth)).toBe(true);
      expect(geometry.tableScrollRange).toBeGreaterThan(0);
      expect(geometry.footerVisibleAfterTableScroll).toBe(true);
      expect(geometry.visualTableHead?.display).toBe("grid");
      expect(geometry.visualTableHead?.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(geometry.visualTableHead?.borderWidth).toBe(0);
      expect(geometry.visualTableHead?.boxShadow).toBe("none");
      expect(geometry.visualTableHead?.overflowY).toBe("hidden");
      expect(geometry.visualTableHead?.scrollRange).toBe(0);
      expect(geometry.visualTableHead?.firstLabel).toBe("角色战绩");
      expect(geometry.visualTableHead?.baselineDifference ?? Infinity).toBeLessThanOrEqual(1);
      expect(geometry.visualTableHead?.bottom ?? Infinity).toBeLessThanOrEqual((geometry.visualTableHead?.scrollTop ?? 0) + 1);
      expect(geometry.tableColumnAlignment).toBeLessThanOrEqual(1);
    } else {
      expect(geometry.identityGeometry?.scale).toBe("1.288");
      expect(geometry.identityGeometry?.headingFontSize).toBe(28);
      expect(Math.abs(
        ((geometry.identityGeometry?.top ?? 0) + (geometry.identityGeometry?.bottom ?? 0)) / 2
        - ((geometry.identityGeometry?.portraitTop ?? 0) + (geometry.identityGeometry?.portraitBottom ?? 0)) / 2
      )).toBeLessThanOrEqual(1);
      expect(geometry.dossierWidth).toBeLessThanOrEqual(viewport.width);
      expect(geometry.panelOverflowY).toBe("visible");
      expect(
        geometry.panelScrollRange,
        JSON.stringify({ ...geometry.verticalLayout, panelScrollRange: geometry.panelScrollRange, tableScrollRange: geometry.tableScrollRange })
      ).toBeLessThanOrEqual(1);
      expect(geometry.tableOverflowY).toBe("auto");
      expect(geometry.tableScrollRange).toBeGreaterThan(0);
      expect(geometry.tableMetrics?.clientHeight ?? 0, JSON.stringify(geometry.verticalLayout)).toBeGreaterThanOrEqual(58);
      expect(Math.abs(geometry.summary[0].top - geometry.summary[1].top)).toBeLessThanOrEqual(1);
      expect(geometry.summary[2].top).toBeGreaterThan(geometry.summary[0].top);
      expect(Math.abs(geometry.summary[2].top - geometry.summary[3].top)).toBeLessThanOrEqual(1);
      expect(geometry.recordRows.every((row) => row.display === "table-row")).toBe(true);
      expect(geometry.recordRows.every((row) => row.cellsOnOneLine && row.cellsNoWrap)).toBe(true);
      expect(geometry.recordRows.every((row) => row.height <= 64)).toBe(true);
      expect(geometry.visualTableHead?.display).toBe("grid");
      expect(geometry.visualTableHead?.firstLabel).toBe("角色战绩");
      expect(geometry.visualTableHead?.baselineDifference ?? Infinity).toBeLessThanOrEqual(1);
      expect(geometry.semanticTableHeadPosition).toBe("absolute");
      expect(geometry.firstColumnShare).toBeGreaterThanOrEqual(0.47);
    }

    const rankHelpTrigger = dialog.getByLabel("段位说明");
    const rankHelpTooltip = rankHelpTrigger.getByRole("tooltip");
    await expect(rankHelpTrigger).toBeVisible();
    await rankHelpTrigger.focus();
    await expect(rankHelpTooltip).toHaveCSS("opacity", "1");
    await page.waitForTimeout(50);
    const rankHelpLayering = await dialog.evaluate((element) => {
      const tooltip = element.querySelector('[aria-label="段位说明"] [role="tooltip"]');
      const panel = element.querySelector(".profile-record-panel");
      const tabs = element.querySelector(".profile-mode-tabs");
      const dialogRect = element.getBoundingClientRect();
      const panelRect = panel?.getBoundingClientRect();
      const tooltipRect = tooltip?.getBoundingClientRect();
      return {
        tooltipZIndex: tooltip ? Number.parseInt(getComputedStyle(tooltip).zIndex, 10) : 0,
        panelZIndex: panel ? Number.parseInt(getComputedStyle(panel).zIndex, 10) : 0,
        tabsZIndex: tabs ? Number.parseInt(getComputedStyle(tabs).zIndex, 10) : 0,
        tooltipInsideDialog: Boolean(tooltipRect
          && tooltipRect.left >= dialogRect.left - 1
          && tooltipRect.right <= dialogRect.right + 1
          && tooltipRect.top >= dialogRect.top - 1
          && tooltipRect.bottom <= dialogRect.bottom + 1),
        tooltipInsidePanelViewport: Boolean(tooltipRect && panelRect
          && tooltipRect.left >= panelRect.left - 1
          && tooltipRect.right <= panelRect.right + 1
          && tooltipRect.top >= panelRect.top - 1
          && tooltipRect.bottom <= panelRect.bottom + 1),
        tooltipRect: tooltipRect ? {
          left: tooltipRect.left,
          right: tooltipRect.right,
          top: tooltipRect.top,
          bottom: tooltipRect.bottom
        } : null,
        panelRect: panelRect ? {
          left: panelRect.left,
          right: panelRect.right,
          top: panelRect.top,
          bottom: panelRect.bottom
        } : null,
        tooltipWidth: tooltipRect?.width ?? 0,
        tooltipHeight: tooltipRect?.height ?? 0
      };
    });
    await rankHelpTrigger.blur();
    expect(rankHelpLayering.panelZIndex).toBeGreaterThan(rankHelpLayering.tabsZIndex);
    expect(rankHelpLayering.tooltipZIndex).toBeGreaterThan(rankHelpLayering.panelZIndex);
    expect(rankHelpLayering.tooltipInsideDialog).toBe(true);
    expect(rankHelpLayering.tooltipInsidePanelViewport, JSON.stringify(rankHelpLayering)).toBe(true);
    expect(rankHelpLayering.tooltipWidth).toBeGreaterThan(0);
    expect(rankHelpLayering.tooltipHeight).toBeGreaterThan(0);

    if (context === "social") {
      expect(geometry.headerAlignment?.topDifference ?? Infinity).toBeLessThanOrEqual(1);
      expect(geometry.headerAlignment?.centerDifference ?? Infinity).toBeLessThanOrEqual(1);
      expect(geometry.controlStyles.like?.text).toMatch(/^\d+$/u);
      if (testInfo.project.name === "desktop-chromium") {
        expect(geometry.controlStyles.like?.width ?? 0).toBeGreaterThanOrEqual(72);
        expect(geometry.controlStyles.like?.width ?? 0).toBeGreaterThan((geometry.friendWidth ?? Infinity) + 20);
      }
      expect(["like", "friend", "blacklist", "report"].every((key) => (
        geometry.controlStyles[key]?.iconWidth === 18 && geometry.controlStyles[key]?.iconHeight === 18
      ))).toBe(true);
      expect(geometry.controlStyles.blacklist?.text).toBe("");
      expect(geometry.controlStyles.report?.text).toBe("");
      expect(geometry.controlStyles.report?.backgroundColor).not.toBe("rgb(255, 246, 221)");
      expect(geometry.identityGeometry?.hasNameplate).toBe(true);
      expect(geometry.identityGeometry?.tagWidth ?? 0).toBeGreaterThanOrEqual(testInfo.project.name === "desktop-chromium" ? 133 : 118);
      expect((geometry.identityGeometry?.tagWidth ?? 0) / (geometry.identityGeometry?.tagHeight ?? 1)).toBeCloseTo(3.75, 1);
      expect(geometry.identityGeometry?.backgroundWidth).toBeCloseTo(geometry.identityGeometry?.tagWidth ?? 0, 1);
      expect(geometry.identityGeometry?.backgroundHeight).toBeCloseTo(geometry.identityGeometry?.tagHeight ?? 0, 1);
    }

    if ((viewport.width === 1440 && context === "self") || (viewport.width === 390 && context === "social")) {
      await page.locator(".toast").waitFor({ state: "detached", timeout: 10_000 }).catch(() => {});
      await page.screenshot({ path: testInfo.outputPath(`${context}-${viewport.width}x${viewport.height}.png`), fullPage: false });
      if (viewport.width === 390 && context === "social") {
        const recordScroll = dialog.locator(".profile-character-table-scroll");
        await recordScroll.evaluate((element) => { element.scrollTop = element.scrollHeight; });
        await page.screenshot({ path: testInfo.outputPath(`${context}-${viewport.width}x${viewport.height}-bottom.png`), fullPage: false });
        await recordScroll.evaluate((element) => { element.scrollTop = 0; });
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

async function readModeTabContract(dialog) {
  return dialog.evaluate((element) => {
    const tabList = element.querySelector(".mode-tabs");
    const tabs = [...element.querySelectorAll(".mode-tabs [role='tab']")];
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
