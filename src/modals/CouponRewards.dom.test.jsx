// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AchievementModal from "./AchievementModal.jsx";
import AdminAchievements from "../admin/AdminAchievements.jsx";
import { adminApi, api } from "../api/client.js";

vi.mock("../api/client.js", () => ({ api: vi.fn(), adminApi: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("coupon rewards with legacy stored data", () => {
  it("shows a coupon label in admin currency targets while saving the compatible coins enum", async () => {
    adminApi.mockResolvedValue({});
    const onSaved = vi.fn(async () => {});
    render(<AdminAchievements token="token" onSaved={onSaved} data={{ rewardAssets: [{
      id: "coupon", type: "currency", targetType: "coins", targetId: "", name: "星炬券奖励", amount: 100,
      text: "100 星炬券", description: "", imageUrl: "/assets/ui/startorch-coupon.webp", enabled: true, sortOrder: 0
    }] }} />);
    fireEvent.click(screen.getByRole("button", { name: "奖励资产", exact: true }));
    expect(screen.getByRole("cell", { name: "星炬券", exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "编辑", exact: true }));
    expect(screen.getByLabelText("目标类型").value).toBe("coins");
    expect(screen.getByRole("option", { name: "星炬券", exact: true }).selected).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "保存奖励资产" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(adminApi).toHaveBeenCalledWith("/achievement-reward-assets/coupon", "token", expect.objectContaining({ body: expect.objectContaining({ targetType: "coins", amount: 100 }) }));
  });

  it("shows the actual coupon amount even when achievement copy and artwork are stale", async () => {
    api.mockResolvedValue({ achievements: [
      { id: "coupon", name: "旧奖励", content: "测试", achieved: false, reward: { type: "currency", targetType: "coins", amount: 100, text: "100 金币", imageUrl: "/old-coin.svg" } },
      { id: "gems", name: "宝石奖励", content: "测试", achieved: false, reward: { type: "currency", targetType: "blueGems", amount: 2, text: "2蓝宝石" } }
    ] });
    const { container } = render(<AchievementModal token="token" />);
    await screen.findByText("100");
    expect(screen.getByRole("img", { name: "星炬券" }).getAttribute("src")).toBe("/assets/ui/startorch-coupon.webp");
    expect(screen.getByText("2蓝宝石")).toBeTruthy();
    expect(container.textContent).not.toContain("金币");
    expect(container.querySelector('img[src="/old-coin.svg"]')).toBeNull();
  });
});
