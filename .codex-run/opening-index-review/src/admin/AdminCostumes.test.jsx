/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import AdminCostumes, { adminCharacterId } from "./AdminCostumes.jsx";

vi.mock("../api/client.js", () => ({
  adminApi: vi.fn()
}));

const costume = {
  id: "nabomo-costume-01",
  name: "娜波摩·服装 01",
  characterSlug: "nabomo",
  portraitUrl: "/assets/costumes/nabomo-01.webp",
  candyEffectPortraitUrl: "",
  description: "",
  illustName: "",
  illustUrl: "",
  priceCoins: 600,
  finalPrice: 600,
  discountPercent: 0,
  shopVisible: true,
  purchasable: true,
  enabled: true,
  sortOrder: 0,
  portraitScalePercent: 100,
  portraitOffsetXPercent: 0,
  portraitOffsetYPercent: 0
};

describe("AdminCostumes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the canonical id from admin character payloads", () => {
    expect(adminCharacterId({ id: "nabomo", name: "娜波摩" })).toBe("nabomo");
    expect(adminCharacterId({ slug: "legacy", name: "兼容角色" })).toBe("legacy");
  });

  it("keeps the canonical character id when editing and saving a costume", async () => {
    adminApi.mockResolvedValue({ costume });
    const onSaved = vi.fn();

    render(
      <AdminCostumes
        costumes={[costume]}
        characters={[{ id: "nabomo", name: "娜波摩" }]}
        token="token"
        onSaved={onSaved}
        onNotice={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(screen.getByLabelText("所属角色").value).toBe("nabomo");

    fireEvent.change(screen.getByLabelText("服装名称"), {
      target: { value: "娜波摩·服装 01（修订）" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(adminApi).toHaveBeenCalledWith("/costumes/nabomo-costume-01", "token", {
        method: "PATCH",
        body: expect.objectContaining({
          characterSlug: "nabomo",
          name: "娜波摩·服装 01（修订）"
        })
      });
    });
    expect(onSaved).toHaveBeenCalledOnce();
  });
});
