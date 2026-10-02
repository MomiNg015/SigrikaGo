// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import {
  replayPageUrl,
  shouldLoadMoreFromScroll,
  useReplayPagination
} from "./useReplayPagination.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("useReplayPagination", () => {
  beforeEach(() => {
    api.mockReset();
  });

  it("loads the first page and appends the next page when the scroll reaches the bottom", async () => {
    api
      .mockResolvedValueOnce({ records: [{ id: "recent" }], nextCursor: "older cursor" })
      .mockResolvedValueOnce({ records: [{ id: "older" }], nextCursor: null });
    const { result } = renderHook(() => useReplayPagination({
      enabled: true,
      endpoint: "/api/replays?mode=spark",
      token: "token"
    }));

    await waitFor(() => expect(result.current.records).toEqual([{ id: "recent" }]));
    act(() => {
      result.current.onScroll({
        currentTarget: { scrollHeight: 1000, scrollTop: 760, clientHeight: 200 }
      });
    });
    await waitFor(() => expect(result.current.records).toEqual([{ id: "recent" }, { id: "older" }]));
    expect(api).toHaveBeenNthCalledWith(2, "/api/replays?mode=spark&cursor=older%20cursor", { token: "token" });
    expect(result.current.hasMore).toBe(false);
  });

  it("builds cursor URLs and ignores scroll positions away from the bottom", () => {
    expect(replayPageUrl("/api/replays?mode=spark", "a/b")).toBe("/api/replays?mode=spark&cursor=a%2Fb");
    expect(shouldLoadMoreFromScroll({ scrollHeight: 1000, scrollTop: 400, clientHeight: 200 })).toBe(false);
  });
});
