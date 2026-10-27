// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { useWarehouseInventory } from "./useWarehouseInventory.js";

vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllEnvs(); });

it("keeps development candy playback ordinary without injecting a blackening test entry", async () => {
  vi.stubEnv("PROD", false);
  const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" };
  const script = { startNodeId: "use-7-start", nodes: [
    { id: "use-7-start", nextNodeId: "shared-effect-start", options: [] },
    { id: "shared-effect-start", text: "普通糖果剧情" },
    { id: "corruption-start", text: "黑化剧情" }
  ] };
  api.mockResolvedValueOnce({ items: [item] }).mockResolvedValueOnce({
    items: [], user: { sigrikaCandyArc: { phase: "normal", useCount: 7 } },
    item, target: { characterId: "sigrika" }, storyScript: script
  });
  const onStoryScript = vi.fn();
  const onSigrikaCorruptionEntry = vi.fn();
  const { result } = renderHook(() => useWarehouseInventory({ characters: { sigrika: { name: "西格莉卡" } },
    token: "token", user: {}, onUserChange: vi.fn(), onStoryScript, onSigrikaCorruptionEntry }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.useItem(item, "sigrika"));
  expect(onStoryScript).toHaveBeenCalledExactlyOnceWith(script, expect.any(Object));
  expect(onStoryScript.mock.calls[0][0].nodes[0].options).toEqual([]);
  expect(onSigrikaCorruptionEntry).not.toHaveBeenCalled();
  expect(api).toHaveBeenCalledTimes(2);
});
