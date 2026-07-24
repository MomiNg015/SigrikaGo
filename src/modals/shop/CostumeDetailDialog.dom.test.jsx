// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CostumeDetailDialog from "./CostumeDetailDialog.jsx";

const costume = {
  id: "denia-costume-01",
  name: "达妮娅舞台服",
  portraitUrl: "/assets/costumes/denia-01.webp",
  description: "舞台服装。",
  finalPrice: 600,
  characterOwned: true,
  purchasable: true,
  owned: false
};

describe("CostumeDetailDialog", () => {
  it("keeps a just-purchased costume owned after declining immediate equipment", async () => {
    const onPurchase = vi.fn(async () => ({ ...costume, owned: true }));
    render(
      <CostumeDetailDialog
        costume={costume}
        purchasing={false}
        equipping={false}
        onPurchase={onPurchase}
        onEquip={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "购买服装" }));
    await screen.findByText("购买成功，是否立即装扮该服装？");
    fireEvent.click(screen.getByRole("button", { name: "暂不装扮" }));

    await waitFor(() => {
      expect(screen.getByText("已拥有")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "购买服装" })).toBeNull();
    });
  });
});
