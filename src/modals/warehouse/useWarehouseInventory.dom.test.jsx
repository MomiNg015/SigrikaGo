// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { useWarehouseInventory } from "./useWarehouseInventory.js";

vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("warehouse candy story", () => {
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
