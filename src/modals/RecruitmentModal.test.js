import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatRecruitmentCountdown,
  presentationReadyRecruitmentTask,
  shouldRecoverInterruptedCinematic
} from "./recruitment/useRecruitmentCatalog.js";
import {
  cinematicPresentationReadyAt,
  recruitmentReadyDelayMs
} from "../shared/recruitment.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RecruitmentModal", () => {
  it("renders a clock fast-forward action during pending recruitment", () => {
    const modalSource = readFileSync(new URL("./RecruitmentModal.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./recruitment/useRecruitmentCatalog.js", import.meta.url), "utf8");

    expect(modalSource).toContain("Clock");
    expect(modalSource).toContain("playRecruitmentResultSound");
    expect(modalSource).toContain("playedResultSoundRef");
    expect(modalSource).toContain("audioSettings");
    expect(modalSource).not.toContain("\u56de\u5e94\u5df2\u7ecf\u9001\u5230\u90e8\u5ba4\u95e8\u53e3");
    expect(modalSource).not.toContain("\u8fd9\u6b21\u8fd8\u6ca1\u6709\u65b0\u56de\u5e94");
    expect(modalSource).toContain('<h2 id="recruitment-modal-title">部员招募栏</h2>');
    expect(modalSource).not.toContain("围棋部招新现场");
    expect(modalSource).not.toContain("公示板已经摆好");
    expect(modalSource).not.toContain("等待招新回应");
    expect(modalSource).toContain("canUse ? \"使用\" : \"不可用\"");
    expect(modalSource).toContain("RecruitmentItemWatermark");
    expect(modalSource).toContain("item?.imageUrl || item?.itemImageUrl");
    expect(modalSource).toContain("<img className=\"recruitment-item-watermark-art\"");
    expect(modalSource).toContain("recruitment-pending-panel");
    expect(modalSource).not.toContain("PosterWatermarkIcon");
    expect(modalSource).not.toContain("RadioWatermarkIcon");
    expect(modalSource).not.toContain("function PosterWatermarkIcon");
    expect(modalSource).not.toContain("function RadioWatermarkIcon");
    expect(modalSource).toContain("瞧瞧有没有新部员！");
    expect(modalSource).not.toContain("查看招新回应");
    expect(modalSource).not.toContain("<strong>{task.itemName}</strong>\n        <button className=\"primary-action\" type=\"button\" disabled={busy} onClick={onClaim}>");
    expect(modalSource).toContain("recruitment-fast-forward-button");
    expect(modalSource).toContain("canFastForward");
    expect(modalSource).toContain("aria-label=\"快速计时到 5 秒\"");
    expect(modalSource).toContain("onFastForward={fastForward}");
    expect(modalSource).toContain("RecruitmentCinematicOverlay");
    expect(modalSource).toContain("RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket");
    expect(modalSource).toContain('style={{ "--recruitment-item-count": items.length }}');
    expect(modalSource).toContain("canFastForward && !task.cinematic");
    expect(hookSource).toContain("/api/recruitment/fast-forward");
    expect(hookSource).toContain("/api/recruitment/interrupt-cinematic");
    expect(hookSource).toContain("theatricalCountdownMs");
    expect(hookSource).toContain("import.meta.env.DEV");
    expect(hookSource).toContain("import.meta.env.MODE === \"development\"");
    expect(hookSource).toContain("import.meta.env.VITE_ENABLE_TEST_TOOLS === \"true\"");
  });

  it("keeps the theatrical countdown moving until the concealed authoritative swap", () => {
    vi.spyOn(Date, "now").mockReturnValue(6_250);
    const task = {
      readyAt: new Date(1_000).toISOString(),
      cinematic: { theatricalCountdownMs: 999 * 60 * 1000 }
    };
    const presentationReadyAt = new Date(11_250).toISOString();

    expect(formatRecruitmentCountdown(task, 0)).toBe("999:00");
    expect(formatRecruitmentCountdown(task, 3_000)).toBe("998:57");
    expect(formatRecruitmentCountdown(task, 6_249)).toBe("998:53");
    expect(formatRecruitmentCountdown(task, 6_250, presentationReadyAt)).toBe("00:05");
    Date.now.mockReturnValue(7_050);
    expect(formatRecruitmentCountdown(task, null, presentationReadyAt)).toBe("00:04");
  });

  it("anchors a fresh cinematic countdown to client receipt instead of request latency", () => {
    const task = {
      status: "pending",
      readyAt: new Date(2_000).toISOString(),
      cinematic: { id: "aemeath-arrival" }
    };
    const presentationReadyAt = cinematicPresentationReadyAt(task, 10_000);

    expect(presentationReadyAt).toBe(new Date(21_250).toISOString());
    expect(recruitmentReadyDelayMs(task, 16_000, presentationReadyAt)).toBe(5_650);
    expect(presentationReadyRecruitmentTask(task)).toMatchObject({
      status: "ready",
      remainingMs: 0,
      cinematic: task.cinematic
    });
  });

  it("keeps the cinematic lock and stable replacement asset slots wired", () => {
    const source = readFileSync(new URL("./recruitment/RecruitmentCinematicOverlay.jsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles/commerce/recruitment/cinematic.css", import.meta.url), "utf8");

    expect(source).toContain("onInteractionLockChange?.(true)");
    expect(source).toContain("AEMEATH_RECRUITMENT_TIMING.darkenAtMs");
    expect(source).toContain("AEMEATH_RECRUITMENT_TIMING.flightAtMs");
    expect(source).toContain("AEMEATH_RECRUITMENT_TIMING.glowAtMs");
    expect(source).toContain("AEMEATH_RECRUITMENT_TIMING.unlockAtMs");
    expect(source).toContain('window.addEventListener("pagehide", interrupt)');
    expect(source).toContain('document.addEventListener("visibilitychange", interruptWhenHidden)');
    expect(source).toContain("task.cinematic?.spriteImageUrl");
    expect(source).toContain("task.cinematic?.spriteSheetUrl");
    expect(source).toContain("recruitment-cinematic-sprite-flight-frame");
    expect(source).toContain("recruitment-cinematic-sprite-wave-frame");
    expect(source).toContain("task.cinematic?.flightSoundUrl");
    expect(source).toContain("task.cinematic?.flashSoundUrl");
    expect(css).toContain("top: var(--recruitment-cinematic-target-y)");
    expect(css).toContain("left: var(--recruitment-cinematic-target-x)");
  });

  it("does not misclassify a normally completed cinematic as an interruption", () => {
    const task = { id: "task-aemeath", status: "pending", cinematic: { id: "aemeath-arrival" } };

    expect(shouldRecoverInterruptedCinematic({
      task,
      cinematicPlaybackTaskId: task.id
    })).toBe(false);
    expect(shouldRecoverInterruptedCinematic({
      task,
      cinematicCompletedTaskId: task.id
    })).toBe(false);
    expect(shouldRecoverInterruptedCinematic({ task })).toBe(true);
    expect(shouldRecoverInterruptedCinematic({
      task: { ...task, status: "ready" }
    })).toBe(false);
  });
});
