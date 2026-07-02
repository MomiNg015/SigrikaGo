import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("TutorialBattleScreen runtime integration", () => {
  it("reuses the real desktop and mobile room shells instead of a fixed desktop-only layout", () => {
    const source = readSource();

    expect(source).toContain("useMobileRoomLayout");
    expect(source).toContain("MobileRoomLayout");
    expect(source).toContain("const Layout = useMobileLayout ? MobileRoomLayout : DesktopRoomLayout");
    expect(source).toContain("const battleLayoutClassName = useMobileLayout ? \"mobile-battle-layout\" : \"battle-layout\"");
    expect(source).toContain("<Layout>");
  });

  it("uses existing room audio effects and background music during local teaching battles", () => {
    const source = readSource();

    expect(source).toContain("useRoomAudioEffects");
    expect(source).toContain("BackgroundMusic");
    expect(source).toContain("resolveBackgroundMusic");
    expect(source).toContain("latestSkillPreview(displayRoom)");
    expect(source).toContain("musicTracks");
  });

  it("pauses background music while exit loading is shown", () => {
    const source = readSource();

    expect(source).toContain("requestBackgroundMusicPause");
    expect(source).toContain("loading.kind === \"setup\"");
    expect(source).toContain("return requestBackgroundMusicPause()");
  });

  it("keeps battle music disabled after an exit transition releases the global pause", () => {
    const source = readSource();

    expect(source).toContain("const [battleMusicActive, setBattleMusicActive] = useState(true)");
    expect(source).toContain("setBattleMusicActive(false)");
    expect(source).toContain("setBattleMusicActive(true)");
    expect(source).toContain("battleMusicActive && tutorialMusic && <BackgroundMusic");
  });

  it("keeps exit loading mounted until route handoff and starts setup loading before first paint", () => {
    const source = readSource();

    expect(source).toContain("initialBattleLoadingForNode(startNode)");
    expect(source).toContain("setLoading(loadingForBoardSetup(targetNode))");
    expect(source).toContain("startExitLoading({ kind: \"story\", node: targetNode, startNodeId: targetNode.id })");
    expect(source).toContain("setNpcBubble(null)");
    expect(source).not.toMatch(/if \(loading\.kind === "story"\) \{[\s\S]*?setLoading\(null\);[\s\S]*?return;/);
  });

  it("uses the shared asset preload template for enter and exit loading states", () => {
    const source = readSource();

    expect(source).toContain("AssetPreloadScreen");
    expect(source).toContain("useTimedLoadingProgress");
    expect(source).toContain("showTips={false}");
    expect(source).toContain("className=\"tutorial-battle-preload-overlay\"");
    expect(source).not.toContain("Loader2");
    expect(source).not.toContain("tutorial-battle-loading");
  });

  it("keeps reply choices as option-only panels without their own close affordance", () => {
    const source = readSource();
    const css = readFileSync(new URL("../styles/room/tutorial-battle-screen/overlay-choice.css", import.meta.url), "utf8");

    expect(source).toContain("tutorial-battle-choice-scrim");
    expect(source).not.toContain("className=\"tutorial-battle-feedback\"");
    expect(source).not.toContain("aria-label=\"选择回复\"");
    expect(source).not.toContain("tutorial-battle-choice-close");
    expect(source).not.toContain("MessageSquareText");
    expect(source).not.toContain("onRequestCloseChoices");
    expect(css).toContain(".tutorial-battle-choice-scrim");
    expect(css).toContain("position: fixed");
    expect(css).toContain("background: rgba(15, 23, 42, 0.58)");
    const choiceBlock = cssBlock(css, ".tutorial-battle-choice");
    expect(choiceBlock).toContain("padding: 0");
    expect(choiceBlock).toContain("border: 0");
    expect(choiceBlock).toContain("background: transparent");
    expect(choiceBlock).toContain("box-shadow: none");
    expect(css).not.toContain("tutorial-battle-choice-close");
    expect(css).not.toContain(".tutorial-battle-choice svg");
  });

  it("uses simplified node progression controls and option transition waits", () => {
    const source = readSource();

    expect(source).toContain("nodeAdvanceControls");
    expect(source).toContain("DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS");
    expect(source).toContain("nodeAutoContinueDelayMs");
    expect(source).toContain("npcDialogueTypewriterDurationMs");
    expect(source).toContain("optionTransitionDelayMs");
    expect(source).toContain("setPendingWait");
    expect(source).toContain("pendingWait");
    expect(source).toContain("revealsChoices: options.length > 0");
    expect(source).toContain("const showPendingWaitHint = !pendingWait.revealsChoices");
    expect(source).toContain("if (choicesVisible && hasOptions)");
    expect(source).not.toContain("可继续，稍后自动推进");
    expect(source).not.toContain("请点击继续");
    expect(source).toContain("skipPendingWait");
    expect(source).toContain("previewControlsEnabled");
    expect(source).toContain("setChoicesVisible(false)");
    expect(source).toContain("schedulePendingWait");
  });

  it("does not reinitialize the same node after a pending progression wait resolves", () => {
    const source = readSource();

    expect(source).toContain("initializedNodeKeyRef");
    expect(source).toContain("if (initializedNodeKeyRef.current === nodeExecutionKey) return");
    expect(source).toContain("initializedNodeKeyRef.current = nodeExecutionKey");
  });

  it("uses full-screen loading and left-right distributed teaching buttons", () => {
    const overlayCss = readFileSync(new URL("../styles/room/tutorial-battle-screen/overlay-choice.css", import.meta.url), "utf8");
    const actionCss = readFileSync(new URL("../styles/room/tutorial-battle-screen/actions-targets.css", import.meta.url), "utf8");
    const targetRingCss = readFileSync(new URL("../styles/room/tutorial-battle-screen/target-ring.css", import.meta.url), "utf8");
    const loadingCss = readFileSync(new URL("../styles/room/tutorial-battle-screen/loading-motion.css", import.meta.url), "utf8");
    const brightChoiceCss = readFileSync(new URL("../styles/themes/bright-school/room/tutorial-choice-interactions.css", import.meta.url), "utf8");

    expect(loadingCss).toContain("position: fixed");
    expect(loadingCss).toContain("min-height: 100dvh");
    expect(overlayCss).toContain("z-index: 4");
    expect(actionCss).toContain("justify-content: stretch");
    expect(actionCss).toContain("background: #e4f8dc");
    expect(actionCss).toContain("flex: 1 1 0");
    expect(actionCss).toContain(".tutorial-action-bar button::after");
    expect(actionCss).toContain(".tutorial-battle-choice button:active");
    expect(actionCss).toContain("background: #ffd6e7");
    expect(targetRingCss).toContain(".board .point.tutorial-target-point .tutorial-target-ring");
    expect(targetRingCss).toContain("animation: tutorial-target-pulse 1.2s ease-in-out infinite");
    expect(brightChoiceCss).toContain(".tutorial-battle-choice button:active:not(:disabled)");
    expect(brightChoiceCss).toContain("background: #ffd6e7 !important");
    expect(brightChoiceCss).toContain(".tutorial-battle-choice button:hover:not(:disabled)");
    expect(brightChoiceCss).toContain("box-shadow: 7px 8px 0 #3d2b25, 0 12px 24px rgba(255, 158, 187, 0.2) !important");
    expect(brightChoiceCss).toContain("filter: saturate(1.04) brightness(1.01) !important");
    expect(brightChoiceCss).toContain("transform: translateY(-4px) rotate(calc(var(--utility-tilt, 0deg) - 0.45deg)) scale(1.018) !important");
    expect(actionCss).toContain(".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar");
    expect(actionCss).toContain("display: flex !important");
    expect(actionCss).toContain("flex-wrap: nowrap !important");
    expect(actionCss).toContain(".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar p");
    expect(actionCss).toContain("grid-column: 1 / -1 !important");
    expect(actionCss).toContain(".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar button");
    const mobileTeachingButtonBlock = cssBlock(actionCss, ".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar button");
    const mobileTeachingButtonTextBlock = cssBlock(actionCss, ".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar button span");
    const mobileTeachingButtonAfterBlock = cssBlock(actionCss, ".mobile-room-screen #mobile-room-panel-actions .tutorial-action-bar button::after");
    expect(mobileTeachingButtonBlock).toContain("justify-content: center !important");
    expect(mobileTeachingButtonBlock).toContain("text-align: center !important");
    expect(mobileTeachingButtonTextBlock).toContain("flex: 0 1 auto !important");
    expect(mobileTeachingButtonTextBlock).toContain("text-align: center !important");
    expect(mobileTeachingButtonAfterBlock).toContain("display: none !important");
  });

  it("colors NPC dialogue bubbles from the active character palette", () => {
    const source = readSource();
    const css = readFileSync(new URL("../styles/room/tutorial-battle-screen/overlay-choice.css", import.meta.url), "utf8");

    expect(source).toContain("--tutorial-npc-color");
    expect(source).toContain("npcBubble.palette");
    expect(css).toContain("var(--tutorial-npc-color");
    expect(css).toContain("color-mix(in srgb, var(--tutorial-npc-color");
  });

  it("keeps NPC bubbles spatially animated when one NPC node replaces another", () => {
    const source = readSource();

    expect(source).toContain("schedule(() => {");
    expect(source).toContain("setNpcBubble((latest) => latest?.id === current.id ? nextBubble : latest)");
    expect(source).toContain("return { ...current, closing: true };");
  });

  it("types NPC bubble text while leaving the speaker name immediate", () => {
    const source = readSource();

    expect(source).toContain("<strong>{npcBubble.speakerName}</strong>");
    expect(source).toContain("<TypewriterText key={npcBubble.id} text={npcBubble.text} />");
    expect(source).toContain("function TypewriterText");
    expect(source).toContain("prefersReducedMotion()");
  });

  it("warns when a player move node receives a board-surface click outside the target point", () => {
    const source = readSource();

    expect(source).toContain("function handleBoardSurface()");
    expect(source).toContain("currentNode?.type === TUTORIAL_NODE_TYPES.playerMove");
    expect(source).toContain("warn(currentNode.wrongClickMessage || \"请在提示区域落子\")");
  });
});

function readSource() {
  return readFileSync(new URL("./TutorialBattleScreen.jsx", import.meta.url), "utf8");
}

function cssBlock(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return "";
  const bodyStart = css.indexOf("{", start);
  const bodyEnd = css.indexOf("}", bodyStart);
  return css.slice(bodyStart + 1, bodyEnd);
}
