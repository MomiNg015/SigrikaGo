// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { COLORS, GAME_PHASES, createGameState, getPoint, pointId, useSkill } from "../../shared/game.js";
import { useRoomBoardView } from "./useRoomBoardView.js";

afterEach(cleanup);

function props() {
  const players = [COLORS.black, COLORS.white].map((color) => ({
    color, user: { id: color }, characterId: "aemeath", time: { main: 300 }, connected: true
  }));
  const game = useSkill(createGameState(players), COLORS.black, "aemeath", pointId(3, 3)).state;
  return { room: { code: "watch", role: "spectator", players, game }, user: { id: "watcher" }, replayStep: null };
}

it("locks live and historical spectators, then enables switching when the room finishes", () => {
  const initialProps = props();
  const { result, rerender } = renderHook(useRoomBoardView, { initialProps });
  expect(result.current.canSwitchView).toBe(false);
  expect(result.current.viewColor).toBeNull();
  expect(result.current.roomViewStatus.label).toBe("实时观战 · 公共观战视角");
  expect(getPoint(result.current.displayRoom.game, pointId(3, 3)).stone).toBeNull();
  act(() => { result.current.setViewColor(COLORS.white); result.current.setSpectatorStep(0); });
  expect(result.current.canSwitchView).toBe(false);
  expect(result.current.viewColor).toBeNull();
  expect(result.current.roomViewStatus.kind).toBe("spectator-history");
  // A prefix containing the hidden hand must also remain concealed.
  initialProps.room.game.history.push({ type: "pass", color: COLORS.white, moveNumber: 2 });
  rerender({ ...initialProps, room: { ...initialProps.room, game: { ...initialProps.room.game } } });
  act(() => result.current.setSpectatorStep(1));
  expect(getPoint(result.current.displayRoom.game, pointId(3, 3)).stone).toBeNull();
  rerender({ ...initialProps, room: { ...initialProps.room, game: { ...initialProps.room.game, phase: GAME_PHASES.finished } } });
  expect(result.current.canSwitchView).toBe(true);
  act(() => result.current.setViewColor(COLORS.white));
  expect(result.current.viewColor).toBe(COLORS.white);
});

it("allows independent replay perspectives even when the source snapshot has a playing phase", () => {
  const { result } = renderHook(useRoomBoardView, { initialProps: { ...props(), replayStep: 1 } });
  expect(result.current.canSwitchView).toBe(true);
  act(() => result.current.setViewColor(COLORS.white));
  expect(result.current.viewColor).toBe(COLORS.white);
});
