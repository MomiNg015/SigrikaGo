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

  it("schedules playable-ready prewarm from the authenticated home shell", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("usePlayableReadyPreload({");
    expect(source).toContain("view,");
    expect(source).toContain("user");
    expect(source).toContain("preloadPlayableIntent");
    expect(source).toContain("onPreloadPlayableReady: preloadPlayableIntent");
  });

  it("keeps startup preload from covering a recovered room", () => {
    const source = readFileSync(new URL("./useStartupPreload.js", import.meta.url), "utf8");

    expect(source).toContain("shouldShowStartupPreload");
    expect(source).toContain("room: roomRef.current");
    expect(source).toContain("matchSuccess: matchSuccessRef.current");
    expect(source).toMatch(/if \(shouldShowStartupPreload\(\{[\s\S]*?setView\("preloading"\);[\s\S]*?\}/);
  });

  it("uses the bandwidth-first login preload concurrency", () => {
    const source = readFileSync(new URL("./useStartupPreload.js", import.meta.url), "utf8");

    expect(source).toContain("concurrency: 6");
    expect(source).toContain("retrySkippedPreloadAssets(skippedAssets, { concurrency: 2 })");
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

  it("wraps the app root in an error boundary", () => {
    const mainSource = readFileSync(new URL("../main.jsx", import.meta.url), "utf8");

    expect(mainSource).toContain("AppErrorBoundary");
    expect(mainSource).toContain("<AppErrorBoundary>");
  });

  it("renders a recovery surface instead of a blank room route", () => {
    const routesSource = readFileSync(new URL("./AppRoutes.jsx", import.meta.url), "utf8");

    expect(routesSource).toContain('view === "room" && (!room || !user)');
    expect(routesSource).toContain("正在恢复对局");
  });

  it("uses the tutorial battle preload fallback for lazy teaching battle entry", () => {
    const routesSource = readFileSync(new URL("./AppRoutes.jsx", import.meta.url), "utf8");

    expect(routesSource).toContain("TUTORIAL_BATTLE_ENTRY_LOADING_TEXT");
    expect(routesSource).toContain("tutorialBattleRouteLoadingScreen");
    expect(routesSource).toContain("fallback={tutorialBattleRouteLoadingScreen}");
    expect(routesSource).toContain("tutorialBattleLoadingCharacter");
    expect(routesSource).toContain("findCharacter(characters, characterId)");
    expect(routesSource).not.toMatch(/view === "tutorial-battle"[\s\S]*?<Suspense fallback=\{routeLoadingScreen\}>/);
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

  it("routes app composition props through focused shell adapters", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(appSource).toContain("buildAppRouteProps");
    expect(appSource).toContain("buildAppOverlayProps");
    expect(appSource).toContain("overlayPropsFromState(overlayState, overlaySetters)");
    expect(appSource).toContain("<AppRoutes {...routeProps} />");
    expect(appSource).toContain("<AppOverlays {...appOverlayProps} />");
    expect(appSource).not.toContain("onCountingRequest={() => socket?.emit");
    expect(appSource).not.toContain("onMessageSubmitted={() => showToast");
  });

  it("delegates mailbox summary polling out of the app composition root", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./useMailboxSummary.js", import.meta.url), "utf8");

    expect(appSource).toContain("useMailboxSummary({");
    expect(appSource).toContain("mailboxOpen: overlayState.mailbox");
    expect(appSource).not.toContain("setMailboxSummary");
    expect(hookSource).toContain("window.setInterval(refreshMailboxSummary, 30000)");
  });

  it("delegates incoming duel request state out of the app composition root", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./useIncomingDuelState.js", import.meta.url), "utf8");

    expect(appSource).toContain("useIncomingDuelState()");
    expect(appSource).not.toContain("const [incomingDuel, setIncomingDuel] = useState(null)");
    expect(hookSource).toContain("initialIncomingDuelState");
    expect(hookSource).toContain("return { incomingDuel, setIncomingDuel }");
  });

  it("blocks app-level modal dismissal while the recruitment cinematic owns input", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("const [recruitmentInteractionLocked, setRecruitmentInteractionLocked]");
    expect(source).toContain("if (recruitmentInteractionLocked) return;");
    expect(source).toMatch(
      /overlayActions:\s*\{[\s\S]*?onRecruitmentInteractionLockChange: setRecruitmentInteractionLocked/
    );
  });
});
