// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import WarehouseItemGrid from "./WarehouseItemGrid.jsx";

afterEach(cleanup);
const candy = { itemId: "candy", name: "糖果", description: "给部员尝尝", targetType: "character", quantity: 2 };
const bag = { itemId: "bag", name: "金币袋", targetType: "self", quantity: 1 };
const poster = { itemId: "campus-recruitment-poster", name: "招募海报", usable: false, quantity: 3 };
const clock = { itemId: "magic-clock", name: "魔法时钟", usable: false, actionVisible: false, quantity: 1 };
function setup(items = [candy, bag, poster, clock], props = {}) {
  const callbacks = { onSelectTargetItem: vi.fn(), onUseItem: vi.fn(), onOpenRecruitment: vi.fn() };
  return { ...render(<WarehouseItemGrid items={items} usingItemId="" {...callbacks} {...props}/>), ...callbacks };
}

describe("warehouse field guide", () => {
  it("selects without consuming and routes the sole action to the correct callback", () => {
    const { onSelectTargetItem, onUseItem } = setup();
    fireEvent.click(screen.getByRole("button", { name: "金币袋，数量 1" }));
    expect(onUseItem).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: /^使用：/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "使用：金币袋" }));
    expect(onUseItem).toHaveBeenCalledWith(bag);
    fireEvent.click(screen.getByRole("button", { name: "糖果，数量 2" }));
    fireEvent.click(screen.getByRole("button", { name: "使用：糖果" }));
    expect(onSelectTargetItem).toHaveBeenCalledWith(candy);
  });
  it("filters and wraps pages within the current category, retaining server restrictions", () => {
    const { onUseItem, onSelectTargetItem, onOpenRecruitment } = setup();
    fireEvent.click(screen.getByRole("button", { name: "招募", exact: true }));
    expect(screen.queryByRole("button", { name: "糖果，数量 2" })).toBeNull();
    const action = screen.getByRole("button", { name: "前去招募：招募海报" });
    expect(action.disabled).toBe(false);
    fireEvent.click(action);
    expect(onOpenRecruitment).toHaveBeenCalledOnce();
    expect(onSelectTargetItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "下一件道具" }));
    expect(screen.getByRole("heading", { name: "魔法时钟" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /前去招募：/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "下一件道具" }));
    expect(screen.getByRole("heading", { name: "招募海报" })).toBeTruthy();
    expect(onUseItem).not.toHaveBeenCalled();
  });
  it("falls forward when the selected item disappears and resolves refreshed quantities", () => {
    const { rerender } = setup();
    fireEvent.click(screen.getByRole("button", { name: "金币袋，数量 1" }));
    rerender(<WarehouseItemGrid items={[candy, poster]} usingItemId=""/>);
    expect(screen.getByRole("heading", { name: "招募海报" })).toBeTruthy();
    rerender(<WarehouseItemGrid items={[{ ...candy, quantity: 0 }]} usingItemId=""/>);
    expect(screen.getByRole("button", { name: "已用完：糖果" }).disabled).toBe(true);
  });
  it("prevents using a different selection while another item request is pending", () => {
    const { onUseItem } = setup([candy, bag], { usingItemId: candy.itemId });
    fireEvent.click(screen.getByRole("button", { name: "金币袋，数量 1" }));
    const action = screen.getByRole("button", { name: "使用：金币袋" });
    expect(action.disabled).toBe(true);
    fireEvent.click(action);
    expect(onUseItem).not.toHaveBeenCalled();
  });
  it("handles empty inventory and empty categories without showing a stale action", () => {
    const { rerender } = setup([candy]);
    fireEvent.click(screen.getByRole("button", { name: "招募", exact: true }));
    expect(screen.getByText("暂无这类道具")).toBeTruthy();
    expect(screen.queryByLabelText("所选道具详情")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "全部", exact: true }));
    expect(screen.getByRole("button", { name: "下一件道具" }).disabled).toBe(true);
    rerender(<WarehouseItemGrid items={[]} usingItemId=""/>);
    expect(screen.getByText("暂无道具")).toBeTruthy();
  });
});
