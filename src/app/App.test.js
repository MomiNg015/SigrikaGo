import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("App startup preload wiring", () => {
  it("passes the music track setter into startup preload", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const preloadCall = source.match(/useStartupPreload\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";

    expect(preloadCall).toContain("setMusicTracks");
  });

  it("keeps startup preload independent from transient socket objects", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const preloadCall = source.match(/useStartupPreload\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";

    expect(preloadCall).not.toContain("socket,");
  });

  it("derives the character list view through the shared catalog sorter", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("characterListFromCatalog");
    expect(source).toContain("characterListFromCatalog(characters)");
    expect(source).not.toContain("Object.values(characters)");
  });

  it("keeps the achievement unlock callback stable for home refresh", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("useCallback, useState");
    expect(source).toContain("const showAchievementUnlocks = useCallback(");
    expect(source).toContain("}, [showToast]);");
  });

  it("delegates recruitment badge timing out of the app composition root", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./useRecruitmentReadyState.js", import.meta.url), "utf8");

    expect(source).toContain("useRecruitmentReadyState({ token, user })");
    expect(source).not.toContain("recruitmentBadgeTask");
    expect(hookSource).toContain("recruitmentBadgeTask.status !== \"pending\"");
    expect(hookSource).toContain("window.setTimeout(refreshRecruitmentBadge, recruitmentReadyDelayMs(recruitmentBadgeTask))");
    expect(hookSource).toContain("return { recruitmentReady, handleRecruitmentStatusChange }");
  });

  it("delegates audio runtime state out of the app composition root", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./useAudioRuntimeState.js", import.meta.url), "utf8");

    expect(appSource).toContain("useAudioRuntimeState");
    expect(appSource).not.toContain("loadAudioSettings");
    expect(appSource).not.toContain("useAudioSettingsPersistence");
    expect(hookSource).toContain("useAudioSettingsPersistence(audioSettings)");
    expect(hookSource).toContain("setAudioResumeSignal((value) => value + 1)");
  });

  it("passes the registered overlay setters through the shared overlay closer", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const actionsSource = readFileSync(new URL("./useAppActions.js", import.meta.url), "utf8");
    const overlayActionsSource = readFileSync(new URL("./useOverlayActions.js", import.meta.url), "utf8");
    const appActionsCall = appSource.match(/useAppActions\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";
    const overlayActionsCall = actionsSource.match(/useOverlayActions\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";

    expect(appSource).toContain("overlaySetters");
    expect(appActionsCall).toContain("overlaySetters");
    expect(overlayActionsCall).toContain("overlaySetters");
    expect(overlayActionsSource).toContain("closeOverlaySetters(overlaySetters)");
  });

  it("delegates mailbox summary polling out of the app composition root", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./useMailboxSummary.js", import.meta.url), "utf8");

    expect(appSource).toContain("useMailboxSummary({");
    expect(appSource).toContain("mailboxOpen: showMailbox");
    expect(appSource).not.toContain("setMailboxSummary");
    expect(hookSource).toContain("window.setInterval(refreshMailboxSummary, 30000)");
  });
});
