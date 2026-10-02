/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import AdminShopItems from "./AdminShopItems.jsx";

vi.mock("../api/client.js", () => ({
  adminApi: vi.fn()
}));

const musicItem = {
  id: "shop-music-qiuyuan-zhouwo",
  name: "肘我",
  category: "music",
  targetId: "qiuyuan-skill-zhouwo",
  itemTargetType: "self",
  stockQuantity: -1,
  priceCoins: 800,
  finalPrice: 800,
  discountPercent: 0,
  purchasable: true,
  enabled: true,
  sortOrder: 320,
  description: "仇远的第二版技能 BGM",
  imageUrl: "/assets/items/qiuyuan-zhouwo.webp",
  illustName: "",
  illustUrl: "",
  source: "default"
};

describe("AdminShopItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and saves the music category without corrupting its value", async () => {
    adminApi.mockResolvedValue({ item: musicItem });
    const onSaved = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminShopItems
        items={[musicItem]}
        token="token"
        onSaved={onSaved}
        onClearError={vi.fn()}
        onNotice={vi.fn()}
      />
    );

    expect(screen.getByRole("cell", { name: "音乐" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "编辑" }));

    const categorySelect = screen.getByLabelText("类别");
    expect(categorySelect.value).toBe("music");
    expect(screen.getByRole("option", { name: "音乐" }).value).toBe("music");

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(adminApi).toHaveBeenCalledWith("/shop-items/shop-music-qiuyuan-zhouwo", "token", {
        method: "PATCH",
        body: expect.objectContaining({
          category: "music",
          targetId: "qiuyuan-skill-zhouwo"
        })
      });
    });
    expect(onSaved).toHaveBeenCalledOnce();
  });
});
