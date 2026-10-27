// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { useWarehouseInventory, withSigrikaCandyDebugJumpOption } from "./useWarehouseInventory.js";
import { SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID } from "../../shared/sigrikaCandyArc.js";
import WarehouseModal from "../WarehouseModal.jsx";

vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
vi.mock("../../shared/sigrikaCandyAvailability.js", () => ({ SIGRIKA_CANDY_CORRUPTION_ENABLED: true }));
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllEnvs(); });

const candyStory = () => ({
  startNodeId: "use-3-start",
  nodes: [
    { id: "use-3-start", nextNodeId: "shared-effect-start", options: [] },
    { id: "shared-effect-start", text: "普通糖果剧情", nextNodeId: "" },
    { id: "corruption-start", text: "黑化剧情", nextNodeId: "corruption-climax" },
    { id: "corruption-climax", text: "高潮", nextNodeId: "" }
  ]
});

describe("warehouse candy story", () => {
  it("routes recruitment items to navigation without consuming inventory", async () => {
    api.mockResolvedValueOnce({ items: [{ itemId: "campus-recruitment-poster", name: "招募海报", quantity: 2, usable: false }] });
    const onOpenRecruitment = vi.fn();
    render(<WarehouseModal token="test-token" user={{}} characters={{}} onClose={vi.fn()} onOpenRecruitment={onOpenRecruitment} />);
    fireEvent.click(await screen.findByRole("button", { name: "前去招募：招募海报" }));
    expect(onOpenRecruitment).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledTimes(1);
  });
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
    fireEvent.click(screen.getByRole("button", { name: "其他道具，数量 1" }));
    expect(screen.getByRole("button", { name: "使用：其他道具" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "彩虹豆豆跳跳糖，数量 2" }));
    expect(screen.getByRole("button", { name: "关闭仓库" }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "关闭角色选择" }).disabled).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "选择角色" }));
    expect(target.closest(".character-target-modal").getAttribute("aria-busy")).toBe("true");
    fireEvent.click(target);
    expect(api).toHaveBeenCalledTimes(2);
    await act(async () => rejectRequest(new Error("请重试")));
    expect(target.disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "其他道具，数量 1" }));
    expect(screen.getByRole("button", { name: "使用：其他道具" }).disabled).toBe(false);
    expect(onNotice).toHaveBeenCalledTimes(1);
    api.mockResolvedValueOnce({ items: [{ ...item, quantity: 1 }, other], user: {}, target: { characterId: "sigrika" }, effectText: "效果已同步" });
    await act(async () => fireEvent.click(target));
    expect(screen.getByRole("dialog", { name: "道具效果" }).textContent).toContain("效果已同步");
    expect(api).toHaveBeenCalledTimes(3);
    expect(onNotice).toHaveBeenCalledTimes(2);
  });

  it.each([
    { production: true, characterId: "sigrika", itemId: "rainbow-bean-candy" },
    { production: false, characterId: "denia", itemId: "rainbow-bean-candy" },
    { production: false, characterId: "sigrika", itemId: "other-item" }
  ])("preserves ordinary playback without a debug handler for %j", async ({ production, characterId, itemId }) => {
    vi.stubEnv("PROD", production);
    const item = { itemId, name: "道具" };
    const storyScript = candyStory();
    const onStoryScript = vi.fn();
    const onUserChange = vi.fn();
    api.mockResolvedValueOnce({ items: [item] }).mockResolvedValueOnce({
      items: [], user: { id: "user-1" }, item, target: { characterId }, storyScript
    });
    const { result } = renderHook(() => useWarehouseInventory({
      characters: {}, token: "test-token", user: {}, onStoryScript, onUserChange
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.useItem(item, characterId));
    expect(onStoryScript.mock.calls[0]).toHaveLength(2);
    expect(onStoryScript.mock.calls[0][0]).toBe(storyScript);
    expect(storyScript.nodes[0].options).toEqual([]);
  });

  it("keeps authored choices intact and avoids duplicate or unreachable debug entries", () => {
    const script = candyStory();
    script.nodes[0].options = [{ label: "普通选择", nextNodeId: "shared-effect-start", revealDelaySeconds: 1 }];
    const options = { characterId: "sigrika", enabled: true };
    const augmented = withSigrikaCandyDebugJumpOption(script, options);
    expect(augmented.nodes[0].options).toEqual([
      ...script.nodes[0].options,
      { label: "【测试】直接跳到第 8 次（黑化剧情）", nextNodeId: SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID }
    ]);
    expect(script.nodes[0].options).toHaveLength(1);
    expect(withSigrikaCandyDebugJumpOption(augmented, options)).toBe(augmented);
    for (const startNodeId of ["corruption-start", "recovery-win-start", "use-8-start"]) {
      const other = { ...script, startNodeId };
      expect(withSigrikaCandyDebugJumpOption(other, options)).toBe(other);
    }
    const incomplete = { ...script, nodes: [script.nodes[0]] };
    expect(withSigrikaCandyDebugJumpOption(incomplete, options)).toBe(incomplete);
  });

  it("delegates the test choice immediately to the app entrance and prevents duplicate navigation", async () => {
    vi.stubEnv("PROD", false);
    const item = { itemId: "rainbow-bean-candy" };
    const onStoryScript = vi.fn();
    let finishEntry;
    const onSigrikaCorruptionEntry = vi.fn(() => new Promise((resolve) => { finishEntry = resolve; }));
    api.mockResolvedValueOnce({ items: [item] }).mockResolvedValueOnce({
      items: [], user: {}, item, target: { characterId: "sigrika" }, storyScript: candyStory()
    });
    const { result } = renderHook(() => useWarehouseInventory({
      characters: {}, token: "test-token", user: {}, onUserChange: vi.fn(), onStoryScript, onSigrikaCorruptionEntry
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.useItem(item, "sigrika"));
    const { onNavigate } = onStoryScript.mock.calls[0][2];
    expect(onNavigate(SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID)).toBe(true);
    expect(onSigrikaCorruptionEntry).toHaveBeenCalledWith({ debug: true });
    onNavigate(SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID);
    expect(onSigrikaCorruptionEntry).toHaveBeenCalledOnce();
    await act(async () => finishEntry());
    expect(api).toHaveBeenCalledTimes(2);
    expect(onStoryScript).toHaveBeenCalledOnce();
  });

  it("jumps from the development choice through the server, serializes clicks and retries errors", async () => {
    vi.stubEnv("PROD", false);
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" };
    const storyScript = candyStory();
    const onStoryScript = vi.fn();
    const onUserChange = vi.fn();
    const onNotice = vi.fn();
    api.mockResolvedValueOnce({ items: [item] }).mockResolvedValueOnce({
      items: [], user: { id: "user-1" }, item, target: { characterId: "sigrika" }, storyScript
    });
    const { result } = renderHook(() => useWarehouseInventory({
      characters: { sigrika: { id: "sigrika", name: "西格莉卡" } },
      token: "test-token", user: { ownedCharacters: ["sigrika"] }, onStoryScript, onUserChange, onNotice
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.useItem(item, "sigrika"));
    expect(api).toHaveBeenLastCalledWith("/api/items/rainbow-bean-candy/use", {
      method: "POST", token: "test-token", body: { characterId: "sigrika" }
    });
    const [augmented, labels, { onNavigate }] = onStoryScript.mock.calls[0];
    expect(augmented.nodes[0].options).toEqual([
      { label: "继续当前剧情", nextNodeId: "shared-effect-start" },
      { label: "【测试】直接跳到第 8 次（黑化剧情）", nextNodeId: SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID }
    ]);
    expect(storyScript.nodes[0].options).toEqual([]);
    expect(onUserChange).toHaveBeenCalledWith({ id: "user-1" });
    expect(onNavigate("shared-effect-start")).toBe(false);
    expect(api).toHaveBeenCalledTimes(2);

    let rejectJump;
    api.mockImplementationOnce(() => new Promise((_, reject) => { rejectJump = reject; }));
    expect(onNavigate(SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID)).toBe(true);
    expect(onNavigate(SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID)).toBe(true);
    expect(api).toHaveBeenCalledTimes(3);
    expect(api).toHaveBeenLastCalledWith("/api/items/rainbow-bean-candy/sigrika/debug/jump-to-eight", {
      method: "POST", token: "test-token"
    });
    await act(async () => rejectJump(new Error("跳转失败")));
    expect(onNotice).toHaveBeenLastCalledWith("跳转失败", "danger");
    expect(onStoryScript).toHaveBeenCalledTimes(1);
    expect(onUserChange).toHaveBeenCalledTimes(1);

    const updatedUser = { id: "user-1", sigrikaCandyArc: { useCount: 8, phase: "corruption-story" } };
    api.mockResolvedValueOnce({ user: updatedUser });
    await act(async () => { expect(onNavigate(SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID)).toBe(true); });
    expect(api).toHaveBeenCalledTimes(4);
    expect(onUserChange).toHaveBeenLastCalledWith(updatedUser);
    expect(onStoryScript).toHaveBeenLastCalledWith(
      { ...storyScript, startNodeId: "corruption-start" }, labels, { dismissible: false }
    );
  });
});
