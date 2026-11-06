// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ConnectionNotice from "./ConnectionNotice.jsx";
import { useRoomActionsReady } from "./useRoomActionsReady.js";
import { markRoomActionsReady, markRoomActionsSyncing } from "./roomActionConnection.js";

afterEach(cleanup);
it("keeps controls disabled and shows syncing until the current room snapshot arrives", () => {
  const socket = { connected: true, emit() {} };
  function View() {
    const ready = useRoomActionsReady(socket, "room");
    return <><ConnectionNotice socket={socket}/><button disabled={!ready}>落子</button></>;
  }
  markRoomActionsSyncing(socket);
  render(<View/>);
  expect(screen.getByRole("button").disabled).toBe(true);
  expect(screen.getByRole("status").textContent).toContain("正在同步对局");
  act(() => markRoomActionsReady(socket, "another-room"));
  expect(screen.getByRole("button").disabled).toBe(true);
  act(() => markRoomActionsReady(socket, "room"));
  expect(screen.getByRole("button").disabled).toBe(false);
  expect(screen.queryByRole("status")).toBeNull();
  act(() => markRoomActionsSyncing(socket));
  expect(screen.getByRole("button").disabled).toBe(true);
});
