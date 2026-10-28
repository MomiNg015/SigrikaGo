import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export async function verifyResultCoupon(page, base = "http://127.0.0.1:5174") {
  const states = [
    { name: "result-win-desktop", width: 1280, height: 800, outcome: "win", amount: "+50" },
    { name: "result-win-mobile", width: 390, height: 844, outcome: "win", amount: "+50" },
    { name: "result-loss-mobile", width: 390, height: 844, outcome: "loss", amount: "+20" },
    { name: "result-win-narrow", width: 320, height: 568, outcome: "win", amount: "+50" }
  ];
  const checks = [];
  for (const state of states) {
    await page.setViewportSize({ width: state.width, height: state.height });
    await page.goto(`${base}/docs/design-samples/result-window-2026-10-11/production.html?outcome=${state.outcome}`);
    await page.locator(".result-reward-coins img").waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = Number.isFinite(animation.effect.getTiming().iterations)
          ? animation.effect.getComputedTiming().endTime : 0;
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const measured = await page.locator(".result-modal").evaluate((modal) => {
      const reward = modal.querySelector(".result-reward-coins");
      const icon = reward.querySelector("img");
      const style = getComputedStyle(icon);
      const wrapper = getComputedStyle(icon.parentElement);
      const rect = modal.getBoundingClientRect();
      return { amount: reward.textContent, src: icon.getAttribute("src"),
        width: parseFloat(style.width), height: parseFloat(style.height),
        padding: wrapper.padding, border: wrapper.borderWidth,
        loaded: icon.naturalWidth === 827 && icon.naturalHeight === 746,
        inViewport: rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
        oldText: modal.textContent.includes("金币") };
    });
    assert.equal(measured.amount, state.amount);
    assert.equal(measured.src, "/assets/ui/startorch-coupon.webp");
    assert.equal(measured.width, 28);
    assert.ok(Math.abs(measured.width / measured.height - 827 / 746) < 0.002);
    assert.equal(measured.padding, "0px");
    assert.equal(measured.border, "0px");
    assert.ok(measured.loaded && measured.inViewport && !measured.oldText);
    const box = await page.locator(".result-modal").boundingBox();
    await page.screenshot({ path: fileURLToPath(new URL(`./${state.name}.png`, import.meta.url)),
      clip: { x: Math.max(0, box.x - 12), y: Math.max(0, box.y - 12),
        width: Math.min(state.width, box.width + 24), height: Math.min(state.height, box.height + 24) } });
    checks.push({ state: state.name, ...measured });
  }
  await page.getByRole("button", { name: "返回棋盘", exact: true }).click();
  await page.locator(".result-modal").waitFor({ state: "hidden" });
  assert.equal(await page.getByText("对弈棋盘", { exact: true }).count(), 1);
  await page.getByRole("button", { name: "重新展示结果", exact: true }).click();
  await page.getByRole("button", { name: "退出房间", exact: true }).click();
  await page.getByText("主界面大厅", { exact: true }).waitFor();
  const result = { checks, actions: { returnToBoard: true, leaveRoom: true } };
  await writeFile(new URL("./verification.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
  return result;
}
