// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CostumeDetailDialog, { CostumePurchaseEquipDialog } from "./CostumeDetailDialog.jsx";

afterEach(cleanup);

const costume = {
  id: "denia-costume-01",
  name: "达妮娅舞台服",
  characterSlug: "denia",
  portraitUrl: "/assets/costumes/denia-01.webp",
  description: "舞台服装。",
  finalPrice: 600,
  characterOwned: true,
  purchasable: true,
  owned: false
};

describe("CostumeDetailDialog", () => {
  it("closes after a successful purchase and hands the purchased costume to the parent prompt", async () => {
    const onPurchase = vi.fn(async () => ({ ...costume, owned: true }));
    const onPurchaseSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <CostumeDetailDialog
        costume={costume}
        purchasing={false}
        onPurchase={onPurchase}
        onPurchaseSuccess={onPurchaseSuccess}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "购买服装" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
      expect(onPurchaseSuccess).toHaveBeenCalledWith(expect.objectContaining({
        id: costume.id,
        owned: true
      }));
    });
  });

  it("closes after a failed purchase without opening the equipment prompt", async () => {
    const onPurchaseSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <CostumeDetailDialog
        costume={costume}
        purchasing={false}
        onPurchase={vi.fn(async () => null)}
        onPurchaseSuccess={onPurchaseSuccess}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "购买服装" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
      expect(onPurchaseSuccess).not.toHaveBeenCalled();
    });
  });

  it("reuses the Zahira detail structure and replaces ownership status with a purchase action", () => {
    const { container } = render(
      <CostumeDetailDialog
        costume={costume}
        purchasing={false}
        onPurchase={vi.fn()}
        onPurchaseSuccess={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.querySelector(".shop-item-detail-modal.costume-detail-modal")).toBeTruthy();
    expect(container.querySelector(".shop-detail-art.costume-detail-art")).toBeTruthy();
    expect(container.querySelector(".shop-detail-copy.costume-detail-copy")).toBeTruthy();
    expect(container.querySelector(".shop-detail-stats .costume-detail-purchase-button")).toBeTruthy();
    expect(screen.getByText("达妮娅服装")).toBeTruthy();
    expect(screen.getByText("售价")).toBeTruthy();
    expect(screen.getByText("600 金币")).toBeTruthy();
    expect(screen.getByRole("button", { name: "购买服装" }).textContent).toBe("购买服装");
    expect(container.querySelector(".costume-detail-price + .costume-detail-purchase-button")).toBeTruthy();
    expect(screen.queryByText("持有状态")).toBeNull();
  });
});

describe("CostumePurchaseEquipDialog", () => {
  it("centers the successful purchase prompt and closes after equipment succeeds", async () => {
    const onEquip = vi.fn(async () => true);
    const onClose = vi.fn();
    const { container } = render(
      <CostumePurchaseEquipDialog
        costume={costume}
        equipping={false}
        onEquip={onEquip}
        onClose={onClose}
      />
    );

    expect(container.querySelector(".costume-equip-prompt-backdrop")).toBeTruthy();
    expect(screen.getByText(`是否立即装扮“${costume.name}”？`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "立即装扮" }));

    await waitFor(() => {
      expect(onEquip).toHaveBeenCalledWith(costume);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
