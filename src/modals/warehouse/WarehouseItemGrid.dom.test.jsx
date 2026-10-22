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
  it("selects recruitment and hidden-action items from the directory without categories or paging", () => {
    const { onUseItem, onSelectTargetItem, onOpenRecruitment } = setup();
    expect(screen.queryByRole("navigation")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "招募海报，数量 3" }));
    expect(screen.getByRole("button", { name: "糖果，数量 2" })).toBeTruthy();
    const action = screen.getByRole("button", { name: "前去招募：招募海报" });
    expect(action.disabled).toBe(false);
    fireEvent.click(action);
    expect(onOpenRecruitment).toHaveBeenCalledOnce();
    expect(onSelectTargetItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "魔法时钟，数量 1" }));
    expect(screen.getByRole("heading", { name: "魔法时钟" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /前去招募：/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "招募海报，数量 3" }));
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
  it("keeps empty directory and detail without allowing a stale action", () => {
    const { rerender, onUseItem, onSelectTargetItem } = setup([candy]);
    rerender(<WarehouseItemGrid items={[]} usingItemId="" onUseItem={onUseItem} onSelectTargetItem={onSelectTargetItem}/>);
    expect(screen.getByText("暂无道具")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByRole("region", { name: "道具目录" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "道具详情" })).toBeTruthy();
    expect(screen.getByLabelText("持有 0")).toBeTruthy();
    expect(screen.queryByText("0 种道具")).toBeNull();
    expect(screen.queryByText("0 / 0")).toBeNull();
    const button = screen.getByRole("button", { name: "使用", exact: true });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onUseItem).not.toHaveBeenCalled();
    expect(onSelectTargetItem).not.toHaveBeenCalled();
  });
  it("keeps selection and renders the latest quantity after an inventory refresh", () => {
    const { rerender, onUseItem } = setup();
    fireEvent.click(screen.getByRole("button", { name: "金币袋，数量 1" }));
    const updated = { ...bag, quantity: 9999 };
    rerender(<WarehouseItemGrid items={[updated, candy]} usingItemId="" onUseItem={onUseItem}/>);
    expect(screen.getByRole("button", { name: "金币袋，数量 9999" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByLabelText("持有 9999")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "使用：金币袋" }));
    expect(onUseItem).toHaveBeenCalledWith(updated);
  });
});
