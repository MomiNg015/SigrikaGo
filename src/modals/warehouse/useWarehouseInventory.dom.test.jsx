// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { useWarehouseInventory } from "./useWarehouseInventory.js";
import WarehouseModal from "../WarehouseModal.jsx";

vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("warehouse candy story", () => {
  it("serializes rapid item requests and releases the lock after rejection and success", async () => {
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" };
    const other = { itemId: "other-item", name: "其他道具" };
    const onNotice = vi.fn();
    const onUserChange = vi.fn();
    let rejectRequest;
    api.mockResolvedValueOnce({ items: [item, other] }).mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject; }));
    const { result } = renderHook(() => useWarehouseInventory({
      characters: {}, token: "test-token", user: {}, onNotice, onUserChange
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let first;
    act(() => {
      first = result.current.useItem(item, "sigrika");
      void result.current.useItem(item, "sigrika");
      void result.current.useItem(other);
    });
    expect(api).toHaveBeenCalledTimes(2);
    expect(result.current.usingItemId).toBe(item.itemId);
    await act(async () => { rejectRequest(new Error("请求失败")); await first; });
    expect(onNotice).toHaveBeenCalledTimes(1);
    expect(result.current.usingItemId).toBe("");
    const updatedUser = { id: "user-1", coins: 30 };
    api.mockResolvedValueOnce({ items: [other], user: updatedUser });
    await act(() => result.current.useItem(other));
    expect(api).toHaveBeenCalledTimes(3);
    expect(onUserChange).toHaveBeenCalledWith(updatedUser);
    expect(result.current.items).toEqual([other]);
    expect(result.current.usingItemId).toBe("");
  });

  it("disables every target and inventory use while held, keeps close available, and allows retry", async () => {
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖", quantity: 2, targetType: "character" };
    const other = { itemId: "other-item", name: "其他道具", quantity: 1, targetType: "self" };
    const onNotice = vi.fn();
    let rejectRequest;
    api.mockResolvedValueOnce({ items: [item, other] }).mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject; }));
    render(<WarehouseModal token="test-token" user={{ ownedCharacters: ["sigrika", "aemeath"] }} characters={{
      sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" },
      aemeath: { id: "aemeath", name: "爱弥斯", portrait: "/assets/aemeath_centered.webp" }
    }} onNotice={onNotice} onUserChange={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "使用：彩虹豆豆跳跳糖" }));
    const target = screen.getByRole("button", { name: "西格莉卡" });
    expect(target.closest(".warehouse-modal")).toBeNull();
    target.focus();
    fireEvent.click(target);
    expect(target.disabled).toBe(true);
    expect(screen.getByRole("button", { name: "爱弥斯" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "使用中：彩虹豆豆跳跳糖" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "使用：其他道具" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "关闭仓库" }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "关闭角色选择" }).disabled).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "选择角色" }));
    expect(target.closest(".character-target-modal").getAttribute("aria-busy")).toBe("true");
    fireEvent.click(target);
    expect(api).toHaveBeenCalledTimes(2);
    await act(async () => rejectRequest(new Error("请重试")));
    expect(target.disabled).toBe(false);
    expect(screen.getByRole("button", { name: "使用：其他道具" }).disabled).toBe(false);
    expect(onNotice).toHaveBeenCalledTimes(1);
    api.mockResolvedValueOnce({ items: [{ ...item, quantity: 1 }, other], user: {}, target: { characterId: "sigrika" }, effectText: "效果已同步" });
    await act(async () => fireEvent.click(target));
    expect(screen.getByRole("dialog", { name: "道具效果" }).textContent).toContain("效果已同步");
    expect(api).toHaveBeenCalledTimes(3);
    expect(onNotice).toHaveBeenCalledTimes(2);
  });

  it("plays the server story without adding a corruption jump or navigation handler", async () => {
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" };
    const storyScript = {
      startNodeId: "use-3-start",
      nodes: [{ id: "use-3-start", nextNodeId: "shared-effect-start", options: [] }]
    };
    const onStoryScript = vi.fn();
    const onUserChange = vi.fn();
    api.mockResolvedValueOnce({ items: [item] }).mockResolvedValueOnce({
      items: [], user: { id: "user-1" }, item, target: { characterId: "sigrika" }, storyScript
    });
    const { result } = renderHook(() => useWarehouseInventory({
      characters: { sigrika: { id: "sigrika", name: "西格莉卡" } },
      token: "test-token", user: { ownedCharacters: ["sigrika"] }, onStoryScript, onUserChange
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.useItem(item, "sigrika"));
    expect(api).toHaveBeenLastCalledWith("/api/items/rainbow-bean-candy/use", {
      method: "POST", token: "test-token", body: { characterId: "sigrika" }
    });
    expect(onStoryScript.mock.calls[0]).toHaveLength(2);
    expect(onStoryScript.mock.calls[0][0]).toBe(storyScript);
    expect(storyScript.nodes[0].options).toEqual([]);
    expect(onUserChange).toHaveBeenCalledWith({ id: "user-1" });
  });
});
