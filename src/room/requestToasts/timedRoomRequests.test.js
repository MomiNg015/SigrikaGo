import { describe, expect, it } from "vitest";
import { GAME_PHASES } from "../../shared/game.js";
import { timedRoomRequestSnapshot, timedRoomRequestToastForPlayer, timedRoomResponseToast } from "./timedRoomRequests.js";

const players = [
  { user: { id: "black", username: "黑方" }, color: "black" },
  { user: { id: "white", username: "白方" }, color: "white" }
];

describe("timed room request toasts", () => {
  it("builds actionable draw and counting request toasts for the receiving player", () => {
    const drawRoom = room({
      phase: GAME_PHASES.drawRequested,
      drawRequest: { requestedBy: "black" },
      drawDeadline: 1000
    });

    expect(timedRoomRequestToastForPlayer(drawRoom, "white")).toMatchObject({
      type: "draw",
      title: "收到和棋申请",
      actions: [
        { action: "draw:accept" },
        { action: "draw:reject" }
      ]
    });
    expect(timedRoomRequestToastForPlayer(drawRoom, "black")).toMatchObject({
      type: "draw",
      title: "和棋申请已发送",
      actions: []
    });

    const countingRoom = room({
      phase: GAME_PHASES.countingRequested,
      scoring: { requestedBy: "white" },
      countingDeadline: 2000
    });
    expect(timedRoomRequestToastForPlayer(countingRoom, "black")).toMatchObject({
      type: "counting",
      title: "收到数子申请",
      actions: [
        { action: "counting:accept" },
        { action: "counting:reject" }
      ]
    });
  });

  it("builds result confirmation toasts and switches accepted players to waiting", () => {
    const result = { text: "黑胜1子", formula: [] };
    const reviewRoom = room({
      phase: GAME_PHASES.resultReview,
      scoring: { result, resultDeadline: 3000, resultAcceptedBy: ["black"] }
    });

    expect(timedRoomRequestToastForPlayer(reviewRoom, "white")).toMatchObject({
      type: "result",
      title: "数子结果确认",
      score: result,
      actions: [
        { action: "result:accept" },
        { action: "result:reject" }
      ]
    });
    expect(timedRoomRequestToastForPlayer(reviewRoom, "black")).toMatchObject({
      title: "已同意数子结果",
      actions: []
    });
  });

  it("formats response toasts when timed requests leave their waiting phase", () => {
    const previous = timedRoomRequestSnapshot(room({
      phase: GAME_PHASES.countingRequested,
      scoring: { requestedBy: "black" }
    }), "white");

    expect(timedRoomResponseToast(previous, room({ phase: GAME_PHASES.markingDead }))).toMatchObject({
      title: "数子申请已回应",
      message: "对方同意数子，请确认死子。",
      autoDismiss: true
    });
    expect(timedRoomResponseToast(previous, room({ phase: GAME_PHASES.playing }))).toMatchObject({
      message: "数子申请未通过，对局继续。"
    });
  });
});

function room({ phase, drawRequest = null, scoring = null, drawDeadline, countingDeadline }) {
  return {
    code: "12345",
    role: "player",
    players,
    drawDeadline,
    countingDeadline,
    game: {
      phase,
      drawRequest,
      scoring
    }
  };
}
