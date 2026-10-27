// @vitest-environment jsdom
import { useLayoutEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppOverlays from "./AppOverlays.jsx";

const pending = vi.hoisted(() => {
  function gate() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
  }
  return { achievements: gate(), personalization: gate(), resumeCleanup: vi.fn() };
});
const features = vi.hoisted(() => ({ PROFILE_CUSTOMIZATION_ENABLED: true }));
vi.mock("../shared/profileFeatures.js", () => features);
beforeEach(() => { features.PROFILE_CUSTOMIZATION_ENABLED = true; });

vi.mock("../modals/ResumeModal.jsx", () => ({
  default: function Resume({ onOpenAchievements, onOpenPersonalization }) {
    useLayoutEffect(() => () => pending.resumeCleanup(), []);
    return (
      <section role="dialog" aria-label="履历">
        <input aria-label="保留的履历状态" defaultValue="原始状态" />
        <button onClick={onOpenAchievements}>成就</button>
        <button onClick={onOpenPersonalization}>个性化</button>
      </section>
    );
  }
}));
vi.mock("../modals/AchievementModal.jsx", async () => {
  await pending.achievements.promise;
  return { default: ({ onClose }) => <section role="dialog" aria-label="成就"><button onClick={onClose}>关闭成就</button></section> };
});
vi.mock("../modals/PersonalizationModal.jsx", async () => {
  await pending.personalization.promise;
  return { default: ({ onClose }) => <section role="dialog" aria-label="个性化"><button onClick={onClose}>关闭个性化</button></section> };
});

function OverlayHarness() {
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  return <AppOverlays user={{ id: 1 }} toasts={[]} showResume
    showAchievements={showAchievements} setShowAchievements={setShowAchievements}
    showPersonalization={showPersonalization} setShowPersonalization={setShowPersonalization} />;
}

afterEach(cleanup);

describe("independent lazy overlay loading", () => {
  it("blocks both customization overlays and their entry callbacks during the internal test", async () => {
    features.PROFILE_CUSTOMIZATION_ENABLED = false;
    const { rerender } = render(<OverlayHarness />);
    await screen.findByRole("dialog", { name: "履历" });
    fireEvent.click(screen.getByRole("button", { name: "成就", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "个性化", exact: true }));
    expect(screen.queryByRole("dialog", { name: "成就" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "个性化" })).toBeNull();
    rerender(<AppOverlays user={{ id: 1 }} toasts={[]} showAchievements showPersonalization />);
    expect(screen.queryByRole("dialog", { name: "成就" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "个性化" })).toBeNull();
  });
  it.each([["成就", "achievements"], ["个性化", "personalization"]])(
    "keeps the resume visible and intact while %s loads for the first time",
    async (name, key) => {
      render(<OverlayHarness />);
      const resume = await screen.findByRole("dialog", { name: "履历" });
      const input = screen.getByLabelText("保留的履历状态");
      fireEvent.change(input, { target: { value: "当前履历状态" } });
      pending.resumeCleanup.mockClear();

      fireEvent.click(screen.getByRole("button", { name, exact: true }));
      expect(screen.getByRole("dialog", { name: "履历" })).toBe(resume);
      expect(pending.resumeCleanup).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name })).toBeNull();

      await act(async () => { pending[key].resolve(); });
      expect(await screen.findByRole("dialog", { name })).toBeTruthy();
      expect(screen.getByRole("dialog", { name: "履历" })).toBe(resume);
      expect(input.value).toBe("当前履历状态");
      fireEvent.click(screen.getByRole("button", { name: `关闭${name}` }));
      expect(screen.queryByRole("dialog", { name })).toBeNull();
      expect(screen.getByRole("dialog", { name: "履历" })).toBe(resume);
      expect(pending.resumeCleanup).not.toHaveBeenCalled();
    }
  );
});
